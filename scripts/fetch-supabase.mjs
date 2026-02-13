/**
 * Pre-build script: fetches published case studies and hearted gallery photos
 * from Supabase REST API, generates Hugo content files and data files.
 *
 * Required environment variables:
 *   SUPABASE_URL      - e.g. https://htalnhgmjnghllyeugmo.supabase.co
 *   SUPABASE_ANON_KEY - the anon/public key (RLS controls access)
 *
 * Zero npm dependencies — uses Node.js native fetch (Node 18+).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const REST_BASE = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Accept': 'application/json',
};

async function supabaseFetch(endpoint) {
  const url = `${REST_BASE}${endpoint}`;
  console.log(`Fetching: ${url}`);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase API error ${res.status}: ${text}`);
  }
  return res.json();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeYaml(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function fetchCaseStudies() {
  const endpoint = '/job_details?' +
    'is_published=eq.true&' +
    'select=id,title,subtitle,description,service,year,duration,location,created_at,updated_at,' +
    'job_photos(id,photo_url,photo_type,is_hearted,sort_order)&' +
    'order=created_at.desc';

  return supabaseFetch(endpoint);
}

async function fetchGalleryPhotos() {
  const endpoint = '/job_photos?' +
    'is_hearted=eq.true&' +
    'photo_type=eq.after&' +
    'select=id,photo_url,sort_order,created_at,' +
    'job_details!job_detail_id(title)&' +
    'order=sort_order.asc,created_at.desc';

  return supabaseFetch(endpoint);
}

function generateProjectMarkdown(job) {
  const photos = (job.job_photos || []).sort((a, b) => a.sort_order - b.sort_order);

  const beforePhotos = photos.filter(p => p.photo_type === 'before');
  const afterPhotos = photos.filter(p => p.photo_type === 'after');
  const allPhotoUrls = photos.map(p => p.photo_url);

  const dateStr = job.created_at ? job.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
  const year = job.year || dateStr.substring(0, 4);

  let yaml = '---\n';
  yaml += `title: "${escapeYaml(job.title)}"\n`;
  if (job.subtitle) {
    yaml += `description: "${escapeYaml(job.subtitle)}"\n`;
  }
  yaml += `date: ${dateStr}\n`;
  if (job.service) {
    yaml += `service: "${escapeYaml(job.service)}"\n`;
  }
  if (job.location) {
    yaml += `location: "${escapeYaml(job.location)}"\n`;
  }
  if (job.duration) {
    yaml += `duration: "${escapeYaml(job.duration)}"\n`;
  }
  yaml += `year: "${escapeYaml(year)}"\n`;
  yaml += `auto_generated: true\n`;
  yaml += `supabase_id: "${job.id}"\n`;

  if (allPhotoUrls.length > 0) {
    yaml += 'images:\n';
    for (const url of allPhotoUrls) {
      yaml += `  - "${escapeYaml(url)}"\n`;
    }
  }

  if (beforePhotos.length > 0) {
    yaml += 'before_images:\n';
    for (const p of beforePhotos) {
      yaml += `  - "${escapeYaml(p.photo_url)}"\n`;
    }
  }

  if (afterPhotos.length > 0) {
    yaml += 'after_images:\n';
    for (const p of afterPhotos) {
      yaml += `  - "${escapeYaml(p.photo_url)}"\n`;
    }
  }

  yaml += '---\n';

  const body = job.description || '';
  return yaml + '\n' + body + '\n';
}

function generateGalleryJson(photos) {
  return photos.map(photo => ({
    id: photo.id,
    url: photo.photo_url,
    caption: photo.job_details?.title || 'Completed Work',
    sort_order: photo.sort_order,
  }));
}

async function main() {
  console.log('=== Supabase Pre-Build Script ===');

  const projectsDir = path.resolve('content/projects');
  const dataDir = path.resolve('data');

  if (!existsSync(projectsDir)) {
    await mkdir(projectsDir, { recursive: true });
  }
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }

  // Fetch and generate case studies
  console.log('\n--- Fetching Case Studies ---');
  try {
    const caseStudies = await fetchCaseStudies();
    console.log(`Found ${caseStudies.length} published case studies`);

    for (const job of caseStudies) {
      const slug = slugify(job.title);
      const filename = `sb-${slug}.md`;
      const filepath = path.join(projectsDir, filename);
      const content = generateProjectMarkdown(job);
      await writeFile(filepath, content, 'utf-8');
      console.log(`  Generated: ${filename}`);
    }
  } catch (err) {
    console.error('Error fetching case studies:', err.message);
  }

  // Fetch and generate gallery data
  console.log('\n--- Fetching Gallery Photos ---');
  try {
    const galleryPhotos = await fetchGalleryPhotos();
    console.log(`Found ${galleryPhotos.length} hearted gallery photos`);

    const galleryData = generateGalleryJson(galleryPhotos);
    const galleryPath = path.join(dataDir, 'gallery.json');
    await writeFile(galleryPath, JSON.stringify(galleryData, null, 2), 'utf-8');
    console.log('  Generated: data/gallery.json');
  } catch (err) {
    console.error('Error fetching gallery photos:', err.message);
  }

  console.log('\n=== Pre-Build Complete ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
