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
    title: 'Prosthetic hand',
    year: '2023',
    image: null,
    description:
      'Led the design of a tendon-driven prosthetic hand from concept through CAD to a working prototype. Fingers split into two sections with slanted tips for grip, fishing wire routed through pulleys to servo motors to close them, and nylon elastic cord to return them open. Hollow palm housing the electronics, with accelerometer and temperature sensing inside and force sensing on the outer surface. Judged best biomedical engineering design in the cohort.',
    tags: ['Fusion 360', 'Servo actuation', 'Arduino', 'Sensor integration', 'Team lead'],
  },
  {
    title: 'Mechanical gripper',
    year: '2025',
    image: null,
    description:
      'A two-jaw mechanical gripper driven by a rack and pinion pair off a single stepper motor, so both jaws stay synchronised from one actuator. Fully 3D printed, with the gear train and jaw travel sized to keep the mechanism backdrivable.',
    tags: ['Rack and pinion', '3D printing', 'Stepper control', 'Mechanism design'],
  },
  {
    title: 'NHS patient management system',
    year: '2025',
    image: null,
    description:
      'A menu-driven patient records system covering the full clinical admin loop: register and look up patients, update symptoms and medical history, schedule and cancel appointments, and discharge. Records persist to disk on exit, with validation and error handling on every branch rather than only the happy path.',
    tags: ['Data structures', 'File persistence', 'Healthcare records', 'Validation'],
  },
  {
    title: 'Final year individual project',
    year: '2027',
    image: null,
    description:
      'Final year individual project, awaiting allocation. Submitted preferences centre on wearable diagnostics and clinical signal processing, which is the direction the rest of my final year is pointed. Details here once the topic is confirmed.',
    tags: ['Signal processing', 'Algorithm design', 'Python', 'Awaiting allocation'],
  },
];
