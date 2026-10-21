import bcrypt from 'bcryptjs';

export const DEMO_PASSWORD = 'DevMatch123!';
export const DEMO_ACCOUNTS = [
  {
    email: 'demo@devmatch.dev',
    name: 'Demo Frontend Dev',
    role: 'frontend',
    seniority: 'mid',
    tech_stack: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    interests: ['open source', 'system design', 'ui/ux', 'mentoring'],
    looking_for: 'mixed',
    bio: 'React developer who wants to understand backends better. Happy to teach React in return!',
    location: 'Bengaluru, India',
    years_experience: 4,
    github_url: '',
    avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=demo-frontend',
  },
  {
    email: 'backend@devmatch.dev',
    name: 'Demo Spring Dev',
    role: 'backend',
    seniority: 'senior',
    tech_stack: ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Docker'],
    interests: ['system design', 'distributed systems', 'mentoring', 'open source'],
    looking_for: 'mixed',
    bio: 'Spring Boot engineer. Want to pick up modern frontend and share backend/system design knowledge.',
    location: 'Hyderabad, India',
    years_experience: 8,
    github_url: '',
    avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=demo-backend',
  },
];
const SEED_DOMAIN = 'seed.devmatch.dev';

const FIRST = [
  'Aarav', 'Priya', 'Liam', 'Emma', 'Noah', 'Olivia', 'Arjun', 'Sofia', 'Mateo', 'Ava', 'Ethan', 'Isha', 'Lucas',
  'Mia', 'Rohan', 'Chloe', 'Kenji', 'Yuki', 'Omar', 'Layla', 'Diego', 'Elena', 'Ravi', 'Ananya', 'Jonas', 'Freya',
  'Kwame', 'Amara', 'Leo', 'Zara', 'Vikram', 'Sara', 'Hugo', 'Nina', 'Tariq', 'Mei', 'Daniel', 'Grace', 'Felix',
  'Hana', 'Samir', 'Clara', 'Ivan', 'Lena', 'Kabir', 'Maya', 'Oscar', 'Aisha', 'Ben', 'Nora',
];
const LAST = [
  'Sharma', 'Smith', 'Garcia', 'Kim', 'Patel', 'Müller', 'Rossi', 'Tanaka', 'Silva', 'Nguyen', 'Johnson', 'Reddy',
  'Kowalski', 'Haddad', 'Okafor', 'Larsen', 'Chen', 'Dubois', 'Iyer', 'Novak', 'Brown', 'Singh', 'Lopez', 'Wang',
  'Fischer', 'Ahmed', 'Costa', 'Petrov', 'Mensah', 'Andersson',
];
const CITIES = [
  'Bengaluru, India', 'Hyderabad, India', 'Pune, India', 'Berlin, Germany', 'London, UK', 'Toronto, Canada',
  'San Francisco, USA', 'Seattle, USA', 'New York, USA', 'Austin, USA', 'Amsterdam, Netherlands', 'Singapore',
  'Tokyo, Japan', 'Sydney, Australia', 'Lisbon, Portugal', 'Remote',
];
const INTERESTS = [
  'open source', 'system design', 'hackathons', 'startups', 'ai', 'web3', 'game dev', 'mentoring', 'clean code',
  'performance', 'accessibility', 'cloud native', 'microservices', 'developer experience', 'ui/ux', 'testing',
  'distributed systems', 'career growth', 'public speaking', 'side projects',
];

const STACKS = {
  frontend: [
    ['React', 'TypeScript', 'Redux', 'Tailwind CSS', 'Jest'],
    ['React', 'Next.js', 'TypeScript', 'GraphQL', 'Tailwind CSS'],
    ['React', 'JavaScript', 'Vite', 'Storybook'],
    ['Vue', 'Nuxt', 'TypeScript', 'Pinia', 'Vite'],
    ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'SCSS'],
    ['Svelte', 'TypeScript', 'Vite', 'Tailwind CSS'],
  ],
  backend: [
    ['Java', 'Spring Boot', 'Hibernate', 'PostgreSQL', 'Kafka'],
    ['Java', 'Spring Boot', 'Microservices', 'MySQL', 'Docker'],
    ['Kotlin', 'Spring Boot', 'PostgreSQL', 'Redis', 'Docker'],
    ['Node.js', 'Express', 'TypeScript', 'MongoDB', 'Redis'],
    ['Node.js', 'NestJS', 'PostgreSQL', 'GraphQL', 'Docker'],
    ['Python', 'Django', 'PostgreSQL', 'Celery', 'Redis'],
    ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    ['Go', 'gRPC', 'PostgreSQL', 'Kubernetes'],
    ['C#', '.NET', 'SQL Server', 'Azure'],
    ['Rust', 'Tokio', 'PostgreSQL', 'Docker'],
  ],
  fullstack: [
    ['React', 'Node.js', 'Express', 'PostgreSQL', 'TypeScript'],
    ['Next.js', 'React', 'Prisma', 'PostgreSQL', 'TypeScript'],
    ['React', 'Spring Boot', 'Java', 'PostgreSQL'],
    ['Vue', 'Django', 'Python', 'PostgreSQL'],
    ['Angular', 'Spring Boot', 'Java', 'MySQL'],
  ],
  mobile: [
    ['Swift', 'SwiftUI', 'Combine', 'Core Data'],
    ['Kotlin', 'Jetpack Compose', 'Android', 'Room'],
    ['React Native', 'TypeScript', 'Redux', 'Expo'],
    ['Flutter', 'Dart', 'Firebase'],
  ],
  devops: [
    ['AWS', 'Terraform', 'Kubernetes', 'Docker', 'GitHub Actions'],
    ['GCP', 'Kubernetes', 'Helm', 'Prometheus', 'Grafana'],
    ['Azure', 'Terraform', 'Ansible', 'Docker'],
    ['AWS', 'Python', 'Docker', 'Linux', 'Jenkins'],
  ],
  data: [
    ['Python', 'Spark', 'Airflow', 'SQL', 'Snowflake'],
    ['Python', 'Pandas', 'dbt', 'PostgreSQL', 'Kafka'],
    ['Scala', 'Spark', 'Kafka', 'AWS'],
  ],
  ml: [
    ['Python', 'PyTorch', 'Transformers', 'MLOps', 'AWS'],
    ['Python', 'TensorFlow', 'scikit-learn', 'Pandas'],
    ['Python', 'LangChain', 'OpenAI', 'Vector Databases', 'FastAPI'],
  ],
  designer: [
    ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
    ['Figma', 'Framer', 'Motion Design', 'CSS'],
  ],
  qa: [
    ['Cypress', 'Playwright', 'JavaScript', 'CI/CD'],
    ['Selenium', 'Java', 'TestNG', 'REST Assured'],
  ],
  security: [
    ['AppSec', 'OWASP', 'Burp Suite', 'Python'],
    ['Cloud Security', 'AWS', 'IAM', 'Terraform'],
  ],
};

const ROLE_COUNTS = {
  frontend: 22, backend: 24, fullstack: 14, mobile: 9, devops: 9, data: 6, ml: 7, designer: 4, qa: 3, security: 2,
};

const ROLE_LABEL = {
  frontend: 'frontend engineer', backend: 'backend engineer', fullstack: 'full-stack developer',
  mobile: 'mobile developer', devops: 'DevOps/SRE engineer', data: 'data engineer', ml: 'ML engineer',
  designer: 'product designer', qa: 'QA automation engineer', security: 'security engineer',
};
const LEARN_FROM = {
  frontend: 'backend & APIs', backend: 'modern frontend', fullstack: 'cloud & infra', mobile: 'backend design',
  devops: 'application development', data: 'machine learning', ml: 'data engineering at scale',
  designer: 'frontend implementation', qa: 'system internals', security: 'infra automation',
};

// Deterministic PRNG so every environment gets the same 100 profiles.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateProfiles(count = 100) {
  const rand = mulberry32(20261020);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const sample = (arr, n) => [...arr].sort(() => rand() - 0.5).slice(0, n);

  const roles = Object.entries(ROLE_COUNTS).flatMap(([role, n]) => Array(n).fill(role)).slice(0, count);
  return roles.map((role, i) => {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 7 + 3) % LAST.length];
    const name = `${first} ${last}`;
    const stack = pick(STACKS[role]);
    const years = 1 + Math.floor(rand() * 15);
    const seniority = years < 3 ? 'junior' : years < 6 ? 'mid' : years < 10 ? 'senior' : 'lead';
    const lookingFor = pick(['similar', 'complementary', 'mixed', 'mixed']);
    const goal =
      lookingFor === 'similar'
        ? `Looking to pair with other ${stack[0]} developers and level up together.`
        : lookingFor === 'complementary'
          ? `Want to learn ${LEARN_FROM[role]} and share my ${stack[0]} experience in return.`
          : `Open to ${stack[0]} buddies and to swapping knowledge on ${LEARN_FROM[role]}.`;
    const handle = `${first}${last}`.normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase();
    return {
      email: `${handle}${i + 1}@${SEED_DOMAIN}`,
      name,
      role,
      seniority,
      bio: `${seniority[0].toUpperCase()}${seniority.slice(1)} ${ROLE_LABEL[role]} working with ${stack
        .slice(0, 3)
        .join(', ')}. ${goal}`,
      tech_stack: stack,
      interests: sample(INTERESTS, 3 + Math.floor(rand() * 3)),
      looking_for: lookingFor,
      location: pick(CITIES),
      years_experience: years,
      github_url: `https://github.com/${handle}${i + 1}`,
      avatar_url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(handle + (i + 1))}`,
    };
  });
}

const COLUMNS = [
  'email', 'password_hash', 'name', 'role', 'seniority', 'bio', 'tech_stack', 'interests', 'looking_for',
  'location', 'years_experience', 'github_url', 'avatar_url',
];

async function insertUser(client, p, hash) {
  const values = COLUMNS.map((c) => (c === 'password_hash' ? hash : p[c]));
  const { rows } = await client.query(
    `INSERT INTO users (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map((_, i) => `$${i + 1}`).join(', ')})
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    values,
  );
  return rows[0].id;
}

async function like(client, from, to) {
  await client.query(
    'INSERT INTO swipes (swiper_id, target_id, liked) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
    [from, to],
  );
}

async function createMatch(client, x, y, lines) {
  await like(client, x, y);
  await like(client, y, x);
  const [a, b] = [x, y].sort((m, n) => m - n);
  const { rows } = await client.query(
    `INSERT INTO matches (user_a, user_b) VALUES ($1, $2)
     ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a RETURNING id`,
    [a, b],
  );
  for (const [i, [sender, content]] of lines.entries()) {
    await client.query(
      `INSERT INTO messages (match_id, sender_id, content, created_at)
       VALUES ($1, $2, $3, now() - make_interval(mins => $4))`,
      [rows[0].id, sender === 'x' ? x : y, content, (lines.length - i) * 7],
    );
  }
}

/** Seeds ~100 developer profiles plus two demo accounts. Idempotent unless force=true. */
export async function seed(client, { force = false } = {}) {
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM users WHERE email LIKE $1`, [`%@${SEED_DOMAIN}`]);
  if (rows[0].n >= 100 && !force) {
    console.log(`Seed skipped: ${rows[0].n} seed profiles already present`);
    return;
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await client.query('BEGIN');
  try {
    if (force) {
      await client.query('DELETE FROM users WHERE email LIKE $1 OR email = ANY($2)', [
        `%@${SEED_DOMAIN}`,
        DEMO_ACCOUNTS.map((d) => d.email),
      ]);
    }
    const demoIds = [];
    for (const d of DEMO_ACCOUNTS) demoIds.push(await insertUser(client, d, hash));
    const ids = [];
    for (const p of generateProfiles(100)) ids.push(await insertUser(client, p, hash));

    const rand = mulberry32(42);
    // Seeded developers already "like" the demo accounts, so liking them back produces live matches.
    for (const id of ids) {
      for (const demo of demoIds) if (rand() < 0.4) await like(client, id, demo);
      for (let k = 0; k < 5; k += 1) {
        const other = ids[Math.floor(rand() * ids.length)];
        if (other !== id) await like(client, id, other);
      }
    }

    const [demo, backendDemo] = demoIds;
    await createMatch(client, demo, backendDemo, [
      ['y', 'Hey! Saw you are into React. I can walk you through Spring Boot + Kafka if you show me hooks 😄'],
      ['x', 'Deal! I have been struggling with designing REST APIs, would love your input.'],
      ['y', 'Perfect. Let\'s pair this weekend?'],
    ]);
    const frontendSeeds = ids.slice(0, 22);
    const backendSeeds = ids.slice(22, 46);
    await createMatch(client, demo, frontendSeeds[0], [
      ['y', 'Hi! Fellow React dev here. Have you tried React Server Components yet?'],
      ['x', 'A little with Next.js. Still wrapping my head around caching.'],
    ]);
    await createMatch(client, demo, backendSeeds[1], [
      ['y', 'Hello! I do Spring Boot and want to learn React. Want to swap knowledge?'],
    ]);
    await createMatch(client, backendDemo, backendSeeds[0], [
      ['y', 'Another Spring person! What are you using for observability?'],
    ]);
    await createMatch(client, backendDemo, frontendSeeds[2], []);

    await client.query('COMMIT');
    console.log(`Seeded ${ids.length} developer profiles + ${demoIds.length} demo accounts`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}
