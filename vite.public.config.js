import { defineConfig } from 'vite';
import { resolve } from 'path';

// Public website — multi-page Vite build. Root is public-site/.
// shared/ lives one level up; server.fs.allow grants dev-server access.
export default defineConfig({
  root: resolve(__dirname, 'public-site'),
  appType: 'mpa',
  server: { port: 5173, fs: { allow: [resolve(__dirname)] } },
  preview: { port: 5173 },
  build: {
    target: 'es2022',
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'public-site/index.html'),
        about: resolve(__dirname, 'public-site/about.html'),
        doctors: resolve(__dirname, 'public-site/doctors.html'),
        doctor: resolve(__dirname, 'public-site/doctor.html'),
        conditions: resolve(__dirname, 'public-site/conditions.html'),
        condition: resolve(__dirname, 'public-site/condition.html'),
        treatments: resolve(__dirname, 'public-site/treatments.html'),
        treatment: resolve(__dirname, 'public-site/treatment.html'),
        services: resolve(__dirname, 'public-site/services.html'),
        lab: resolve(__dirname, 'public-site/lab.html'),
        booking: resolve(__dirname, 'public-site/booking.html'),
        faq: resolve(__dirname, 'public-site/faq.html'),
        blog: resolve(__dirname, 'public-site/blog.html'),
        blogDetail: resolve(__dirname, 'public-site/blog-detail.html'),
        contact: resolve(__dirname, 'public-site/contact.html'),
        privacy: resolve(__dirname, 'public-site/privacy.html'),
        terms: resolve(__dirname, 'public-site/terms.html'),
        disclaimer: resolve(__dirname, 'public-site/medical-disclaimer.html'),
        emergency: resolve(__dirname, 'public-site/emergency.html')
      }
    }
  }
});
