/* ============================================================
   PROJECTS
   Single source of truth for the pinned arc list and the orbiting
   circle gallery. Order here is the render order in both.

   title       shown in the list, and uppercased as the tile label
   year        rendered into the panel meta row
   image       optional preview image. Resolved against the Vite
               base URL so it survives a subpath deploy. Leave
               null to show the text placeholder instead. Any
               project given an image also gets the cylinder bend
               treatment in the circle gallery automatically.
   description panel body copy
   tags        rendered as pills under the description

   Employment lives in the Experience section of index.html, not
   here. This array is projects only.
   ============================================================ */

const asset = (file) => `${import.meta.env.BASE_URL}assets/projects/${file}`;

export const projects = [
  {
    title: 'Jenny.ai',
    blurb: 'Multi-agent desktop assistant that takes real actions.',
    year: '2026',
    image: asset('jenny.webp'),
    fit: 'contain', /* a UI screenshot, show all of it rather than crop it */
    scale: 1.3, /* the flagship build, given more presence in the ring */
    description:
      'A multi-agent desktop assistant that takes real actions rather than just answering. Tool orchestration across 41 declared tools, retrieval over a persistent memory store, streaming responses with inspectable tool receipts, and a human-in-the-loop approval gate before anything executes. Held together by 17 automated test suites.',
    tags: ['Claude API', 'RAG', 'Electron', 'React', 'Python', 'WebSocket'],
  },
  {
    title: 'Prosthetic hand',
    blurb: '3D printed paediatric hand. Best design in cohort.',
    year: '2023',
    image: asset('prosthetic-hand.webp'),
    gallery: [asset('prosthetic-hand.webp'), asset('prosthetic-hand-cad.webp')],
    description:
      'Led a four person team designing a 3D printed paediatric prosthetic hand, built from child-safe materials with shock absorption and thermal safety designed in. Fingers split into two sections with slanted tips for grip, fishing wire routed through pulleys to servo motors to close them, and nylon elastic cord to return them open. Hollow palm housing the electronics, with accelerometer and temperature sensing inside and force sensing on the outer surface. Awarded best biomedical engineering design in the cohort.',
    tags: ['Fusion 360', 'Servo actuation', 'Arduino', 'Sensor integration', 'Team lead'],
  },
  {
    title: 'Mechanical gripper',
    blurb: 'Gear-driven jaws that hold any shape.',
    year: '2025',
    image: asset('gripper.webp'),
    description:
      'A two-jaw gripper designed in Fusion 360 and 3D printed, driven through a gear train off a single Dynamixel servo so both jaws stay synchronised from one actuator. Tested against objects of varying shape and size, and it held all of them.',
    tags: ['Fusion 360', '3D printing', 'Dynamixel servo', 'Mechanism design'],
  },
  {
    title: 'NHS patient management system',
    blurb: 'C++ patient database with secure search.',
    year: '2024',
    image: asset('nhs-flowchart.webp'),
    invert: true, /* exported on white, flipped to sit on the dark page */
    fit: 'contain', /* a tall flowchart, letterbox it rather than crop it */
    description:
      'A C++ patient database simulating the full clinical admin loop: registration, record updates, secure search, symptom and medical history edits, appointment scheduling and cancellation, and discharge. Records persist to disk on exit, with validation on every branch rather than only the happy path.',
    tags: ['C++', 'Data structures', 'File persistence', 'Healthcare records'],
  },
  {
    title: 'Final year individual project',
    blurb: 'Wearable diagnostics. Awaiting allocation.',
    year: '2027',
    image: null,
    description:
      'Final year individual project, awaiting allocation. Submitted preferences centre on wearable diagnostics and clinical signal processing, which is the direction the rest of my final year is pointed. Details here once the topic is confirmed.',
    tags: ['Signal processing', 'Algorithm design', 'Python', 'Awaiting allocation'],
  },
];

/* ============================================================
   GALLERY EXTRAS
   Work that belongs in the ring but is not a project in its own
   right, so it never appears in the arc list. The Layqa storefront
   is the deliverable from the Digital Consultant role rather than a
   separate project, but it is real shipped work and worth showing.
   ============================================================ */
export const galleryExtras = [
  {
    title: 'Layqa Perfumes',
    blurb: 'Next.js storefront for a Dubai fragrance brand.',
    image: asset('layqa.webp'),
  },
];
