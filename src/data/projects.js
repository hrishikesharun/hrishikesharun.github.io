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
    blurb: 'Desktop assistant that acts, but never on its own.',
    year: '2026',
    image: asset('jenny.webp'),
    fit: 'contain', /* a UI screenshot, show all of it rather than crop it */
    scale: 1.3, /* the flagship build, given more presence in the ring */
    description:
      'A Windows desktop AI assistant that reads live data from Gmail, Blackboard, six job boards, LinkedIn and local files, and acts on the machine through 41 tools. Two rules shape the build: she may not state anything she has not actually read, and the model never changes anything itself. Every state change comes from deterministic code, with confirmation gates on destructive or outbound actions, so nothing can be hallucinated into existence. Four processes, each existing because the one above it cannot do the job, covered by 17 regression suites that test functions extracted from the shipped source.',
    tags: ['Claude API', 'Electron', 'React', 'Node.js', 'Cloudflare Workers', '17 test suites'],
  },
  {
    title: 'Deep Brain Stimulation',
    blurb: 'Final year project. Machine learning on neural recordings.',
    year: '2027',
    image: null,
    description:
      'Final year research project under Prof S. Nasuto: developing machine learning methods to identify and remove stimulation artefacts from brain recordings of patients undergoing Deep Brain Stimulation. Ongoing, with results to follow here.',
    tags: ['Signal processing', 'Machine learning', 'Neural recordings', 'Ongoing'],
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
    title: 'Patient management system',
    blurb: 'C++ patient database with record search.',
    year: '2024',
    image: asset('patient-records-flowchart.webp'),
    invert: true, /* exported on white, flipped to sit on the dark page */
    fit: 'contain', /* a tall flowchart, letterbox it rather than crop it */
    description:
      'A C++ patient database simulating the full clinical admin loop: registration, record updates, record search, symptom and medical history edits, appointment scheduling and cancellation, and discharge. Records persist to disk on exit, with validation on every branch rather than only the happy path.',
    tags: ['C++', 'Data structures', 'File persistence', 'Healthcare records'],
  },
];

/* ============================================================
   GALLERY EXTRAS
   Work that belongs in the ring but is not a project in its own
   right, so it never appears in the arc list. The Layqa work came out
   of the Digital Consultant role rather than being a project of its
   own, but it is real work and worth showing.
   ============================================================ */
export const galleryExtras = [
  {
    title: 'Layqa Perfumes',
    blurb: 'Website and digital content for a Dubai fragrance brand.',
    image: asset('layqa.webp'),
  },
];
