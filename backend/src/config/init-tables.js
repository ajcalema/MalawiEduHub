/**
 * Initialize missing database tables and columns
 * Runs on server startup
 */

const { query } = require('./db');

const initTables = async () => {
  try {
    console.log('🔧 Checking database tables...');

    // --- FIXED: Create users columns ---
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`);
      console.log('✅ users.failed_login_attempts column ready');
    } catch {}

    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ`);
      console.log('✅ users.locked_until column ready');
    } catch {}

    // --- FIXED: Create refresh_tokens columns ---
    try {
      await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS device_name VARCHAR(100)`);
      console.log('✅ refresh_tokens.device_name column ready');
    } catch {}

    try {
      await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip_address INET`);
      console.log('✅ refresh_tokens.ip_address column ready');
    } catch {}

    try {
      await query(`ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT`);
      console.log('✅ refresh_tokens.user_agent column ready');
    } catch {}

    // --- FIXED: Create document_requests table ---
    const requestsTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'document_requests'
      );
    `);

    if (!requestsTableCheck.rows[0].exists) {
      console.log('📦 Creating document_requests table...');
      
      await query(`
        CREATE TABLE document_requests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id),
          subject_id INTEGER REFERENCES subjects(id),
          title VARCHAR(300) NOT NULL,
          description TEXT,
          level VARCHAR(20),
          year SMALLINT,
          status VARCHAR(20) DEFAULT 'pending',
          fulfilled_doc_id UUID REFERENCES documents(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`CREATE INDEX idx_requests_user ON document_requests (user_id)`);
      await query(`CREATE INDEX idx_requests_status ON document_requests (status)`);

      console.log('✅ document_requests table created successfully');
    } else {
      console.log('✅ document_requests table already exists');
    }

    // --- FIXED: Check password_reset_tokens ---
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📦 Creating password_reset_tokens table...');
      
      await query(`
        CREATE TABLE password_reset_tokens (
          id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash  TEXT NOT NULL UNIQUE,
          expires_at  TIMESTAMPTZ NOT NULL,
          used        BOOLEAN NOT NULL DEFAULT FALSE,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`CREATE INDEX idx_reset_tokens_user ON password_reset_tokens (user_id)`);
      await query(`CREATE INDEX idx_reset_tokens_hash ON password_reset_tokens (token_hash)`);
      await query(`CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens (expires_at)`);

      console.log('✅ password_reset_tokens table created successfully');
    } else {
      console.log('✅ password_reset_tokens table already exists');
    }

    // --- NEW: Create classes table ---
    const classesTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'classes'
      );
    `);

    if (!classesTableCheck.rows[0].exists) {
      console.log('📦 Creating classes table...');
      
      await query(`
        CREATE TABLE classes (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          display_name VARCHAR(100) NOT NULL,
          level_type VARCHAR(20) NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`
        INSERT INTO classes (name, display_name, level_type, sort_order) VALUES
        ('Form 1', 'Form 1 (JCE)', 'jce', 1),
        ('Form 2', 'Form 2 (JCE)', 'jce', 2),
        ('Form 3', 'Form 3 (MSCE)', 'msce', 3),
        ('Form 4', 'Form 4 (MSCE)', 'msce', 4)
      `);

      console.log('✅ classes table created successfully');
    } else {
      console.log('✅ classes table already exists');
    }

    // --- NEW: Create topics table ---
    const topicsTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'topics'
      );
    `);

    if (!topicsTableCheck.rows[0].exists) {
      console.log('📦 Creating topics table...');
      
      await query(`
        CREATE TABLE topics (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          subject_id INTEGER NOT NULL REFERENCES subjects(id),
          class_id INTEGER NOT NULL REFERENCES classes(id),
          description TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`CREATE INDEX idx_topics_subject_class ON topics (subject_id, class_id)`);

      // Seed sample topics
      await query(`
        INSERT INTO topics (name, subject_id, class_id, description, sort_order) VALUES
        ('Introduction to Biology', 2, 1, 'Basic concepts of biology and living things', 1),
        ('Cell Structure', 2, 1, 'Understanding the cell as the basic unit of life', 2),
        ('Cell Organization', 2, 1, 'Tissues, organs and organ systems', 3),
        ('Nutrition in Plants', 2, 1, 'How plants prepare their own food', 4),
        ('Nutrition in Animals', 2, 1, 'Different feeding habits in animals', 5),
        ('Transport in Plants', 2, 1, 'Movement of water and minerals', 6),
        ('Transport in Animals', 2, 1, 'Circulatory system in humans', 7),
        ('Respiration', 2, 1, 'Gas exchange and energy release', 8),
        ('Excretion', 2, 1, 'Removal of waste products', 9),
        ('Growth and Development', 2, 1, 'How organisms grow and change', 10),
        ('Number Systems', 1, 1, 'Natural numbers, integers, fractions', 1),
        ('Simplification', 1, 1, 'BODMAS and algebraic simplification', 2),
        ('Equations', 1, 1, 'Linear equations in one variable', 3),
        ('Straight Lines', 1, 1, 'Coordinates and straight line graphs', 4),
        ('Ratio and Proportion', 1, 1, 'Sharing in given ratios', 5),
        ('Percentages', 1, 1, 'Calculations involving percentages', 6),
        ('Perimeter and Area', 1, 1, '2D shapes measurements', 7),
        ('Volume', 1, 1, '3D shapes and volume calculations', 8),
        ('Statistics', 1, 1, 'Data collection and representation', 9),
        ('Probability', 1, 1, 'Basic probability concepts', 10),
        ('Introduction to Chemistry', 3, 1, 'What is chemistry?', 1),
        ('States of Matter', 3, 1, 'Solid, liquid and gas', 2),
        ('Atomic Structure', 3, 1, 'Protons, neutrons and electrons', 3),
        ('Chemical Bonding', 3, 1, 'Ionic and covalent bonds', 4),
        ('The Periodic Table', 3, 1, 'Arrangement of elements', 5),
        ('Chemical Formulae', 3, 1, 'Writing chemical formulas', 6),
        ('Chemical Equations', 3, 1, 'Balancing chemical equations', 7),
        ('Acids and Bases', 3, 1, 'Properties of acids and bases', 8),
        ('Salts', 3, 1, 'Preparation and uses of salts', 9),
        ('Air and Combustion', 3, 1, 'Composition of air, burning', 10),
        ('Introduction to Physics', 4, 1, 'What is physics?', 1),
        ('Measurements', 4, 1, 'Length, mass, time', 2),
        ('Motion', 4, 1, 'Speed, velocity and acceleration', 3),
        ('Forces', 4, 1, 'Types of forces', 4),
        ('Pressure', 4, 1, 'Pressure in solids, liquids and gases', 5),
        ('Light', 4, 1, 'Reflection and refraction', 6),
        ('Heat', 4, 1, 'Heat transfer', 7),
        ('Waves', 4, 1, 'Types of waves', 8),
        ('Electricity', 4, 1, 'Current, voltage, resistance', 9),
        ('Magnetism', 4, 1, 'Magnetic fields', 10),
        ('Reading Comprehension', 5, 1, 'Understanding passages', 1),
        ('Writing Skills', 5, 1, 'Essay and letter writing', 2),
        ('Grammar', 5, 1, 'Parts of speech', 3),
        ('Vocabulary', 5, 1, 'Word building', 4),
        ('Verbs and Tenses', 5, 1, 'Past, present, future', 5),
        ('Direct and Indirect Speech', 5, 1, 'Reported speech', 6),
        ('Essay Writing', 5, 1, 'Structuring essays', 7),
        ('Summary Writing', 5, 1, 'Summarizing passages', 8),
        ('Poetry', 5, 1, 'Understanding poems', 9),
        ('Literature', 5, 1, 'Prose and drama', 10),
        ('Classification', 2, 2, 'Kingdoms of living things', 1),
        ('The Cell', 2, 2, 'Cell structure and function', 2),
        ('Movement', 2, 2, 'Joint and muscles', 3),
        ('Sensitivity', 2, 2, 'Nervous system', 4),
        ('Homeostasis', 2, 2, 'Control and regulation', 5),
        ('Reproduction', 2, 2, 'Human reproductive system', 6),
        ('Growth and Development', 2, 2, 'Puberty and growth', 7),
        ('Inheritance', 2, 2, 'Genetics basics', 8),
        ('Evolution', 2, 2, 'Theory of evolution', 9),
        ('Health and Disease', 2, 2, 'Communicable diseases', 10),
        ('Ecology', 2, 3, 'Study of ecosystems', 1),
        ('Population', 2, 3, 'Population dynamics', 2),
        ('Nitrogen Cycle', 2, 3, 'Nitrogen in nature', 3),
        ('Carbon Cycle', 2, 3, 'Carbon in nature', 4),
        ('Food Webs', 2, 3, 'Energy flow', 5),
        ('Pollution', 2, 3, 'Environmental issues', 6),
        ('Conservation', 2, 3, 'Wildlife protection', 7),
        ('Genetics', 2, 3, 'Heredity', 8),
        ('Variation', 2, 3, 'Differences in species', 9),
        ('Natural Selection', 2, 3, 'Survival of fittest', 10),
        ('Revision', 2, 4, 'Comprehensive revision', 1),
        ('Past Papers Practice', 2, 4, 'Exam preparation', 2),
        ('Mock Exams', 2, 4, 'Trial examinations', 3)
      `);

      console.log('✅ topics table created successfully');
    } else {
      console.log('✅ topics table already exists');
    }

    // --- NEW: Create user_topic_progress table ---
    const progressTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_topic_progress'
      );
    `);

    if (!progressTableCheck.rows[0].exists) {
      console.log('📦 Creating user_topic_progress table...');
      
      await query(`
        CREATE TABLE user_topic_progress (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
          is_completed BOOLEAN NOT NULL DEFAULT FALSE,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`CREATE INDEX idx_progress_user ON user_topic_progress (user_id)`);
      await query(`CREATE UNIQUE INDEX idx_progress_user_topic ON user_topic_progress (user_id, topic_id)`);

      console.log('✅ user_topic_progress table created successfully');
    } else {
      console.log('✅ user_topic_progress table already exists');
    }

    // --- NEW: Create user_class_selection table ---
    const classSelectionCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_class_selection'
      );
    `);

    if (!classSelectionCheck.rows[0].exists) {
      console.log('📦 Creating user_class_selection table...');
      
      await query(`
        CREATE TABLE user_class_selection (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          class_id INTEGER NOT NULL REFERENCES classes(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await query(`CREATE UNIQUE INDEX idx_user_class ON user_class_selection (user_id)`);

      console.log('✅ user_class_selection table created successfully');
    } else {
      console.log('✅ user_class_selection table already exists');
    }

    console.log('✅ Database tables check complete\n');
  } catch (err) {
    console.error('❌ Failed to initialize tables:', err.message);
  }
};

module.exports = { initTables };
