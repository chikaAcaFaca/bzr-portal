import { createAdditionalBlogPosts } from './scripts/additional-blog-posts';

// Pokretanje skripta za kreiranje dodatnih blog postova
async function main() {
  console.log('Pokretanje skripta za kreiranje dodatnih blog postova...');
  
  try {
    await createAdditionalBlogPosts();
    console.log('Blog postovi su uspešno kreirani!');
  } catch (error) {
    console.error('Greška prilikom kreiranja blog postova:', error);
  }
}

main();