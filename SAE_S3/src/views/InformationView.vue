<template>
  <div class="information">
    <div class="hero">
      <div class="container">
        <h1>Qui sommes nous </h1>
        <section class="festival">
          <h2>Golden Coast Festival</h2>

          <!-- separation visuelle à la place des tags -->
          <div class="divider" aria-hidden="true"></div>

          <p class="lead">
            Le Golden Coast Festival est le plus grand festival 100 % rap de France. Il se déroule sur le site naturel de la Combe à la Serpent, à Corcelles-les-Monts, près de Dijon.
          </p>

          <p>
            Après une première édition couronnée de succès avec plus de 52 000 festivaliers sur deux jours, le festival revient encore plus fort pour trois jours de musique et de culture urbaine.
          </p>

          <p class="highlight">
            Le Golden Coast met à l’honneur la diversité du rap français, des têtes d’affiche aux nouveaux talents, dans une ambiance unique mêlant énergie, partage et passion. C’est bien plus qu’un festival : un véritable rendez-vous pour tous les amateurs de rap.
          </p>

          <div class="actions">
            <!-- remplacé : bouton -> lien externe vers Wikipédia -->
            <a class="cta" href="https://fr.wikipedia.org/wiki/Golden_Coast" target="_blank" rel="noopener noreferrer">En savoir plus</a>
            <a class="secondary" href="#lineup">Voir la programmation</a>
          </div>
        </section>

        <!-- Nouvelle section : galerie d'artistes -->
        <section class="artists" aria-label="Artistes">
          <h3 class="artists-title">Artistes à l'affiche</h3>

          <!-- Remplacé : génération dynamique des cartes artistes -->
          <div class="artist-grid">
            <figure
              class="artist-card"
              v-for="artist in artists"
              :key="artist.name"
            >
              <div class="artist-media">
                <a :href="artist.spotify" target="_blank" rel="noopener noreferrer">
                  <img :src="artist.img" :alt="artist.name" class="artist-img" />
                </a>
                <div class="artist-overlay" aria-hidden="true"></div>
              </div>
              <figcaption class="artist-name">{{ artist.name }}</figcaption>
            </figure>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InformationView',
  data() {
    return {
      artists: [
        {
          name: 'Maître Gims',
          img: 'https://www.lanuitdelerdre.fr/wp-content/uploads/gims-e1740569570393.jpg',
          spotify: 'https://open.spotify.com/search/Ma%C3%AEtre%20Gims'
        },
        {
          name: 'Ninho et Niska',
          img: 'https://scontent-fra3-1.xx.fbcdn.net/v/t39.30808-6/496004409_1092075232942862_132560724372333224_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=Xu1QkM17mxMQ7kNvwGJZ0UI&_nc_oc=AdkCr3EEz4Y9-f1_7yOzy0sLxX7D4z2I5S8HM8gE1W-QTvKE7oapMC6R_HGU8jMeO704UjQRpq-4_7n5q_bMeHr7&_nc_zt=23&_nc_ht=scontent-fra3-1.xx&_nc_gid=cvK5GMH71Yx0pUdLiOe9RA&oh=00_AffwiSNxoIUqAbKf4sjj7IDh8VYB4Pmcx9HIC6y39Zl2TQ&oe=68F6AF44',
          spotify: 'https://open.spotify.com/search/Ninho%20Niska'
        },
        {
          name: 'Bigflo et Oli',
          img: 'https://cdn-images.dzcdn.net/images/artist/3b41169cf03e1787462612f7c82ad0bb/1900x1900-000000-81-0-0.jpg',
          spotify: 'https://open.spotify.com/search/Bigflo%20%26%20Oli'
        }
      ]
    }
  }
}
</script>

<style scoped>

.information {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: stretch;
  justify-content: center;

  background:
    radial-gradient(700px 260px at 12% 12%, rgba(255, 190, 60, 0.14), transparent 18%),
    linear-gradient(180deg, rgba(2, 24, 80, 0.93) 0%, #010410 50%, #a68506 100%);
  color: #f6f7fb;
  padding: 48px 16px;
  box-sizing: border-box;
}

/* Hero central */
.hero {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 36px 0;
  position: relative;
}

/* Conteneur central */
.container {
  max-width: 1100px;
  width: 100%;
  margin: 0 16px;
}

/* Card glassmorphism */
.festival {
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 215, 80, 0.08);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 18px 50px rgba(2,6,23,0.65), inset 0 1px 0 rgba(255,255,255,0.02);
  color: #f8fafc;
  line-height: 1.6;
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  transition: transform .18s ease, box-shadow .18s ease;
}
.festival:hover {
  transform: translateY(-6px);
  box-shadow: 0 28px 70px rgba(2,6,23,0.75);
}

/* Titres et texte : doré pour rappeler "Golden" */
h1 {
  margin: 0 0 10px 0;
  font-size: 1.65rem;
  font-weight: 800;
  color: #FCDC1E; /* or doré */
  letter-spacing: 0.4px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.45);
}

.festival h2 {
  margin: 0 0 12px 0;
  font-size: 1.95rem;
  color: #FCDC1E; /* doré plus doux */
  font-weight: 800;
  letter-spacing: 0.6px;
  text-shadow: 0 6px 18px rgba(0,0,0,0.45);
}

/* suppression des badges — plus d'espace propre */
.divider {
  width: 56px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255,209,102,0.95), rgba(159, 120, 22, 0.9));
  margin: 10px 0 18px 0;
  box-shadow: 0 6px 18px rgba(255,160,60,0.12);
}

/* Lead plus visible */
.lead {
  font-size: 1.06rem;
  margin-bottom: 14px;
  color: #f1f6ff;
  font-weight: 600;
}

/* Paragraphe normal */
.festival p {
  margin: 10px 0;
  font-size: 0.98rem;
  color: #dbeafe;
}

/* Highlight : plus contrasté */
.festival .highlight {
  font-weight: 700;
  background: linear-gradient(90deg, rgba(255,210,100,0.06), rgba(255,255,255,0.02));
  padding: 14px;
  border-radius: 10px;
  margin-top: 12px;
  color: #fffefc;
  border: 1px solid rgba(255,210,100,0.06);
}

/* Actions : boutons plus contrastés et dorés */
.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  align-items: center;
}

/* CTA doré/chaud plus marqué */
.cta {
  background: linear-gradient(90deg,#ffd166, #dcb00b);
  border: none;
  color: #1b1b1b;
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(255,120,80,0.18), inset 0 -6px 24px rgba(255,255,255,0.04);
  transition: transform .15s ease, box-shadow .15s ease;
}
.cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 42px rgba(255,100,50,0.22);
}

/* Secondary plus lisible (bouton lien) */
.secondary {
  color: #ffdca3;
  text-decoration: none;
  font-size: 0.98rem;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.03);
}

/* Focus accessibility */
.cta:focus, .secondary:focus {
  outline: 3px solid rgba(255,210,100,0.18);
  outline-offset: 3px;
}

/* Ajout : galerie d'artistes */
.artists {
  margin-top: 28px;
}

.artists-title {
  margin: 0 0 12px 0;
  font-size: 1.25rem;
  color: #ffd166; /* doré */
  font-weight: 800;
  text-shadow: 0 4px 12px rgba(0,0,0,0.45);
}

/* grille responsive des cartes — 3 colonnes par ligne sur grand écran */
.artist-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 cases par ligne */
  gap: 18px;
}

/* carte artiste (glassmorphism cohérent avec .festival) */
.artist-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 215, 80, 0.06);
  border-radius: 12px;
  overflow: hidden;
  text-align: center;
  transition: transform .18s ease, box-shadow .18s ease;
  box-shadow: 0 8px 28px rgba(2,6,23,0.5);
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

/* média : utiliser un ratio pour garder la vignette proportionnée,
   centrer l'image et permettre l'affichage entier (object-fit: contain) */
.artist-media {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3; /* format fixe de la vignette */
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.06); /* contraste pour les bords de l'image */
  flex-shrink: 0;
}

/* image : afficher l'image entière sans crop */
.artist-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  transition: transform .35s ease;
}

/* léger overlay gradient pour meilleure lisibilité */
.artist-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.28));
  pointer-events: none;
}

/* nom artiste */
.artist-name {
  padding: 12px 10px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.04));
  color: #ffd166;
  font-size: 0.98rem;
}

/* hover effects (conserver un léger zoom sans crop) */
.artist-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 50px rgba(2,6,23,0.65);
}
.artist-card:hover .artist-img {
  transform: scale(1.03);
}

/* Responsive : 2 colonnes et 1 colonne */
@media (max-width: 1000px) {
  .artist-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .artist-media { aspect-ratio: 4 / 3; }
}

@media (max-width: 600px) {
  .artist-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  .artist-media { aspect-ratio: 16 / 9; }
}

/* Responsive */
@media (max-width: 800px) {
  .information { padding: 28px 12px; }
  .festival { padding: 20px; border-radius: 12px; }
  h1 { font-size: 1.4rem; }
  .festival h2 { font-size: 1.45rem; }
  .actions { flex-direction: column; align-items: stretch; }
  .cta { width: 100%; }
  .secondary { text-align: center; width: 100%; }
}

@media (max-width: 420px) {
  .container { margin: 0 8px; }
  .lead, .festival p { font-size: 0.95rem; }
  .artist-media { height: 140px; }
  .artist-name { font-size: 0.92rem; padding: 10px; }
}
</style>
