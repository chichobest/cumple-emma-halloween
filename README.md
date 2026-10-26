# 🎃 Cumple de Emma · Concurso de Disfraces

SPA para gestionar en directo las votaciones del concurso de disfraces.

- **Panel de votos** (`/`): desde el móvil, Emma suma `+1`, `+2`, `+3` de cada papeleta, añade/edita niños y deshace errores.
- **Marcador TV** (`/#tv`): podio en directo (oro/plata/bronce, con empates), resto de la clasificación, animaciones al recibir votos, aviso de “¡Nuevo líder!” y botón de celebración con confeti y fanfarria.

## Desarrollo

```bash
npm install
npm run dev
```

## Sincronización en tiempo real

| Modo | Cuándo | Qué sincroniza |
| --- | --- | --- |
| **Firestore** | Variables `VITE_FIREBASE_*` definidas | Cualquier dispositivo (móvil ↔ TV) |
| **Local** | Sin variables | Solo pestañas del mismo navegador (LocalStorage + evento `storage`) |

Para usar móvil + TV en la fiesta **hace falta Firestore**:

1. Crea un proyecto en [Firebase](https://console.firebase.google.com), añade una app web y activa **Cloud Firestore**.
2. Copia `.env.example` a `.env.local` y rellena los valores (en Vercel/Netlify, defínelos como variables de entorno del proyecto).
3. Reglas de Firestore (abiertas solo para esta colección y con fecha de caducidad):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cumple_emma_participants/{id} {
      allow read, write: if request.time < timestamp.date(2026, 11, 15);
    }
  }
}
```

La pastilla de estado indica el modo: **En directo** (Firestore conectado), **Conectando…**, **Modo local** o **Sin conexión**.
