/* ============================================================
   PROJECTS
   Single source of truth for the pinned arc list in the Work
   section. Order here is the render order on the page.

   title       shown in the list, and uppercased as the frame
               placeholder label
   year        rendered into the panel meta row
   image       optional preview image. Resolved against the Vite
               base URL so it survives a subpath deploy. Leave
               null to show the text placeholder instead.
   description panel body copy
   tags        rendered as pills under the description
   ============================================================ */

const asset = (file) => `${import.meta.env.BASE_URL}assets/${file}`;

export const projects = [
  {
    title: 'Jenny.ai',
    year: '2026',
    image: null,
    description:
      'A multi-agent desktop assistant that takes real actions rather than just answering. Tool orchestration, retrieval over a persistent memory store, streaming responses with inspectable tool receipts, and a human-in-the-loop approval gate before anything executes.',
    tags: ['Claude API', 'RAG', 'Electron', 'React', 'Python', 'WebSocket'],
  },
  {
    title: 'Wearable sensing',
    year: '2025',
    image: null,
    description:
      'Wearable sensor systems and the signal chain behind them. Sensor selection, conditioning, and extracting a usable physiological signal from a noisy real-world recording. Highest mark of my second year at 80.',
    tags: ['Biosensors', 'Signal conditioning', 'MATLAB'],
  },
  {
    title: 'Prosthetic arm',
    year: '2024',
    image: null,
    description:
      'Led the design of a prosthetic arm from concept through CAD and prototyping. Judged best biomedical engineering design in the cohort. First time I led a technical team rather than just contributing to one.',
    tags: ['Fusion 360', 'Mechanical design', 'Team lead'],
  },
  {
    title: 'Kriya Medical',
    year: '2024',
    image: asset('kriya.jpg'),
    description:
      'R&D and product design across diagnostic hardware. RT-PCR kit development, design work on test tubes, insulin syringes and diagnostic kits, plus QA and production floor exposure. Ten weeks in Chennai that changed how I think about manufacturing constraints.',
    tags: ['RT-PCR', 'Product design', 'QA', 'Manufacturing'],
  },
  {
    title: 'Layqa data',
    year: '2026',
    image: null,
    description:
      'Voluntary data analyst work for an independent fragrance brand. Built the reporting layer over sales and campaign data, and translated it into decisions the founder could actually act on. Unpaid, ongoing.',
    tags: ['SQL', 'Analytics', 'Reporting'],
  },
  {
    title: 'Wrist pulse oximetry',
    year: '2027',
    image: null,
    description:
      'Final-year project, in progress. Heart rate and SpO₂ detection algorithms for a wrist-worn pulse oximeter. Motion artefact is the whole problem: the wrist is a far worse measurement site than the finger, and the algorithm has to earn its accuracy back.',
    tags: ['PPG', 'Algorithm design', 'Python', 'In progress'],
  },
];
