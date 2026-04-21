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

      // Seed comprehensive topics for ALL subjects and ALL forms
      // Subject IDs: 1=Math, 2=Biology, 3=Chemistry, 4=Physics, 5=English, 6=Chichewa, 7=History, 8=Geography, 9=Agriculture, 10=Computer, 11=Business, 12=ReligiousEd
      // Class IDs: 1=Form1, 2=Form2, 3=Form3, 4=Form4
      await query(`
        INSERT INTO topics (name, subject_id, class_id, description, sort_order) VALUES
        -- FORM 1 MATHEMATICS (1)
        ('Number Systems', 1, 1, 'Natural numbers, integers, fractions, decimals', 1),
        ('Simplification (BODMAS)', 1, 1, 'Order of operations and algebraic simplification', 2),
        ('Linear Equations', 1, 1, 'Solving equations in one variable', 3),
        ('Linear Inequalities', 1, 1, 'Solving inequalities', 4),
        ('Coordinates & Graphs', 1, 1, 'Plotting points and straight line graphs', 5),
        ('Ratio & Proportion', 1, 1, 'Sharing quantities in given ratios', 6),
        ('Percentages', 1, 1, 'Calculations involving percentages', 7),
        ('Perimeter & Area', 1, 1, 'Measuring 2D shapes', 8),
        ('Volume', 1, 1, 'Calculating volume of 3D shapes', 9),
        ('Statistics', 1, 1, 'Data collection, tables, charts, mean', 10),
        
        -- FORM 2 MATHEMATICS
        ('Quadratic Equations', 1, 2, 'Solving quadratic equations', 1),
        ('Simultaneous Equations', 1, 2, 'Solving two equations together', 2),
        ('Indices & Logarithms', 1, 2, 'Laws of indices and logarithms', 3),
        ('Variation', 1, 2, 'Direct and inverse variation', 4),
        ('Sequences & Series', 1, 2, 'Arithmetic and geometric progressions', 5),
        ('Algebraic Fractions', 1, 2, 'Simplifying algebraic fractions', 6),
        ('Circle Theorems', 1, 2, 'Properties of circles', 7),
        ('Trigonometry', 1, 2, 'Sine, cosine, tangent ratios', 8),
        ('Probability', 1, 2, 'Theoretical and experimental probability', 9),
        ('Vectors', 1, 2, 'Introduction to vectors', 10),

        -- FORM 3 MATHEMATICS
        ('Advanced Trigonometry', 1, 3, 'Trigonometric identities and equations', 1),
        ('Calculus - Differentiation', 1, 3, 'Introduction to derivatives', 2),
        ('Calculus - Integration', 1, 3, 'Introduction to integration', 3),
        ('Algebraic Proofs', 1, 3, 'Mathematical proof techniques', 4),
        ('Functions', 1, 3, 'Types of functions and graphs', 5),
        ('Binomial Theorem', 1, 3, 'Expansion of (a+b)^n', 6),
        ('Matrices', 1, 3, 'Matrix operations', 7),
        ('Complex Numbers', 1, 3, 'Introduction to i = sqrt(-1)', 8),
        ('Coordinate Geometry', 1, 3, 'Equation of circles and tangents', 9),
        ('Statistics', 1, 3, 'Standard deviation and correlation', 10),

        -- FORM 4 MATHEMATICS
        ('Calculus Review', 1, 4, 'Full calculus revision', 1),
        ('Past Papers Practice 1', 1, 4, 'Exam-style questions', 2),
        ('Past Papers Practice 2', 1, 4, 'Exam-style questions', 3),
        ('Past Papers Practice 3', 1, 4, 'Exam-style questions', 4),
        ('Mock Examination', 1, 4, 'Trial exam paper', 5),

        -- FORM 1 BIOLOGY (2)
        ('Introduction to Biology', 2, 1, 'What is biology? Characteristics of life', 1),
        ('Cell Structure', 2, 1, 'Cell as the basic unit of life', 2),
        ('Cell Organization', 2, 1, 'Tissues, organs, organ systems', 3),
        ('Nutrition in Plants', 2, 1, 'Photosynthesis and food production', 4),
        ('Nutrition in Animals', 2, 1, 'Balanced diet and digestion', 5),
        ('Transport in Plants', 2, 1, 'Movement of water and minerals', 6),
        ('Transport in Animals', 2, 1, 'Circulatory system', 7),
        ('Respiration', 2, 1, 'Gas exchange and energy release', 8),
        ('Excretion', 2, 1, 'Removal of metabolic wastes', 9),
        ('Growth & Development', 2, 1, 'How organisms grow', 10),

        -- FORM 2 BIOLOGY
        ('Classification', 2, 2, 'Kingdoms of living organisms', 1),
        ('Cell Division', 2, 2, 'Mitosis and meiosis', 2),
        ('Movement', 2, 2, 'Skeleton and muscles', 3),
        ('Sensitivity', 2, 2, 'Nervous system and coordination', 4),
        ('Homeostasis', 2, 2, 'Body temperature and sugar regulation', 5),
        ('Reproduction', 2, 2, 'Human reproductive system', 6),
        ('Growth & Development', 2, 2, 'Puberty and changes', 7),
        ('Inheritance', 2, 2, 'Basic genetics', 8),
        ('Evolution', 2, 2, 'Theory of evolution', 9),
        ('Health & Disease', 2, 2, 'Communicable diseases', 10),

        -- FORM 3 BIOLOGY
        ('Ecology', 3, 3, 'Study of ecosystems', 1),
        ('Population', 3, 3, 'Population dynamics', 2),
        ('Nitrogen Cycle', 3, 3, 'Nitrogen in nature', 3),
        ('Carbon Cycle', 3, 3, 'Carbon in nature', 4),
        ('Energy Flow', 3, 3, 'Food webs and pyramids', 5),
        ('Pollution', 3, 3, 'Environmental pollution', 6),
        ('Conservation', 3, 3, 'Wildlife conservation', 7),
        ('Advanced Genetics', 3, 3, 'Mendelian inheritance', 8),
        ('Variation', 3, 3, 'Differences in organisms', 9),
        ('Natural Selection', 3, 3, 'Survival of the fittest', 10),

        -- FORM 4 BIOLOGY
        ('Comprehensive Revision', 2, 4, 'All topics review', 1),
        ('Exam Practice 1', 2, 4, 'Past paper questions', 2),
        ('Exam Practice 2', 2, 4, 'Past paper questions', 3),
        ('Mock Examination', 2, 4, 'Trial exam', 4),

        -- FORM 1 CHEMISTRY (3)
        ('Introduction to Chemistry', 3, 1, 'What is chemistry? Branches', 1),
        ('States of Matter', 3, 1, 'Solid, liquid, gas', 2),
        ('Atomic Structure', 3, 1, 'Protons, neutrons, electrons', 3),
        ('Chemical Bonding', 3, 1, 'Ionic and covalent bonds', 4),
        ('The Periodic Table', 3, 1, 'Groups and periods', 5),
        ('Chemical Formulae', 3, 1, 'Writing formulas', 6),
        ('Chemical Equations', 3, 1, 'Balancing equations', 7),
        ('Acids & Bases', 3, 1, 'Properties of acids and bases', 8),
        ('Salts', 3, 1, 'Preparation of salts', 9),
        ('Air & Combustion', 3, 1, 'Composition of air, burning', 10),

        -- FORM 2 CHEMISTRY
        ('Structure of Atom', 3, 2, 'Electron configuration', 1),
        ('Chemical Reactions', 3, 2, 'Types of reactions', 2),
        ('Oxidation & Reduction', 3, 2, 'Redox reactions', 3),
        ('Electrochemistry', 3, 2, 'Electrolysis', 4),
        ('Chemical Energy', 3, 2, 'Exothermic and endothermic', 5),
        ('Rates of Reaction', 3, 2, 'Speed of reactions', 6),
        ('Chemical Equilibrium', 3, 2, 'Reversible reactions', 7),
        ('Acids, Bases & Salts', 3, 2, 'pH scale, indicators', 8),
        ('Organic Chemistry', 3, 2, 'Hydrocarbons introduction', 9),
        ('Pollution', 3, 2, 'Environmental chemistry', 10),

        -- FORM 3 CHEMISTRY
        ('Advanced Atomic Structure', 3, 3, 'Orbitals, quantum numbers', 1),
        ('Chemical Bonding', 3, 3, 'Advanced bonding concepts', 2),
        ('Thermochemistry', 3, 3, 'Enthalpy calculations', 3),
        ('Chemical Kinetics', 3, 3, 'Reaction mechanisms', 4),
        ('Chemical Equilibrium', 3, 3, 'Equilibrium constant', 5),
        ('Electrochemistry', 3, 3, 'Galvanic cells', 6),
        ('Organic Chemistry', 3, 3, 'Functional groups', 7),
        ('Polymers', 3, 3, 'Addition and condensation polymers', 8),
        ('Analytical Chemistry', 3, 3, 'Chromatography, spectroscopy', 9),
        ('Environmental Chemistry', 3, 3, 'Green chemistry', 10),

        -- FORM 4 CHEMISTRY
        ('Comprehensive Revision', 3, 4, 'All topics review', 1),
        ('Exam Practice 1', 3, 4, 'Past paper questions', 2),
        ('Exam Practice 2', 3, 4, 'Past paper questions', 3),
        ('Mock Examination', 3, 4, 'Trial exam', 4),

        -- FORM 1 PHYSICS (4)
        ('Introduction to Physics', 4, 1, 'What is physics? Measurement', 1),
        ('Measurements', 4, 1, 'Length, mass, time, volume', 2),
        ('Motion', 4, 1, 'Speed, velocity, acceleration', 3),
        ('Forces', 4, 1, 'Types of forces, Newton laws', 4),
        ('Pressure', 4, 1, 'Pressure in solids, liquids, gases', 5),
        ('Light', 4, 1, 'Reflection and refraction', 6),
        ('Heat', 4, 1, 'Heat transfer, temperature', 7),
        ('Waves', 4, 1, 'Types of waves, properties', 8),
        ('Electricity', 4, 1, 'Current, voltage, resistance', 9),
        ('Magnetism', 4, 1, 'Magnetic fields, electromagnets', 10),

        -- FORM 2 PHYSICS
        ('Vectors', 4, 2, 'Vector addition and resolution', 1),
        ('Kinematics', 4, 2, 'Equations of motion', 2),
        ('Dynamics', 4, 2, 'Newton laws application', 3),
        ('Work, Energy, Power', 4, 2, 'Energy conversion', 4),
        ('Circular Motion', 4, 2, 'Centripetal force', 5),
        ('Gravitation', 4, 2, 'Universal gravitation', 6),
        ('Elasticity', 4, 2, 'Hooke law, stress, strain', 7),
        ('Heat Transfer', 4, 2, 'Conduction, convection, radiation', 8),
        ('Waves & Sound', 4, 2, 'Wave equations, sound', 9),
        ('Electrostatics', 4, 2, 'Electric charges, fields', 10),

        -- FORM 3 PHYSICS
        ('Fields', 4, 3, 'Gravitational, electric, magnetic fields', 1),
        ('Electromagnetic Induction', 4, 3, 'Faraday law, Lenz law', 2),
        ('AC Circuits', 4, 3, 'Alternating current', 3),
        ('Electronics', 4, 3, 'Semiconductors, diodes', 4),
        ('Modern Physics', 4, 3, 'Photoelectric effect', 5),
        ('Nuclear Physics', 4, 3, 'Radioactivity, half-life', 6),
        ('Particle Physics', 4, 3, 'Subatomic particles', 7),
        ('Cosmology', 4, 3, 'Universe and solar system', 8),
        ('Medical Physics', 4, 3, 'X-rays, ultrasound', 9),
        ('Practical Skills', 4, 3, 'Lab techniques', 10),

        -- FORM 4 PHYSICS
        ('Comprehensive Revision', 4, 4, 'All topics review', 1),
        ('Exam Practice 1', 4, 4, 'Past paper questions', 2),
        ('Exam Practice 2', 4, 4, 'Past paper questions', 3),
        ('Mock Examination', 4, 4, 'Trial exam', 4),

        -- FORM 1 ENGLISH (5)
        ('Reading Comprehension', 5, 1, 'Understanding passages', 1),
        ('Writing Skills', 5, 1, 'Essays, letters', 2),
        ('Grammar - Parts of Speech', 5, 1, 'Nouns, verbs, adjectives', 3),
        ('Vocabulary Building', 5, 1, 'Word roots, prefixes, suffixes', 4),
        ('Verbs & Tenses', 5, 1, 'Present, past, future', 5),
        ('Direct & Indirect Speech', 5, 1, 'Reported speech', 6),
        ('Essay Writing', 5, 1, 'Structure and organization', 7),
        ('Summary Writing', 5, 1, 'Summarizing passages', 8),
        ('Poetry Analysis', 5, 1, 'Understanding poems', 9),
        ('Literature - Prose', 5, 1, 'Novels and short stories', 10),

        -- FORM 2 ENGLISH
        ('Advanced Comprehension', 5, 2, 'Complex passages', 1),
        ('Creative Writing', 5, 2, 'Narrative and descriptive', 2),
        ('Advanced Grammar', 5, 2, 'Conditionals, modals', 3),
        ('Vocabulary', 5, 2, 'Idioms and phrasal verbs', 4),
        ('Reported Speech', 5, 2, 'Complex transformations', 5),
        ('Article Writing', 5, 2, 'Newspaper articles', 6),
        ('Poetry', 5, 2, 'Analysis techniques', 7),
        ('Drama', 5, 2, 'Play analysis', 8),
        ('Composition', 5, 2, 'Argumentative writing', 9),
        ('Literature', 5, 2, 'Novel study', 10),

        -- FORM 3 ENGLISH
        ('Critical Reading', 5, 3, 'Analysis and evaluation', 1),
        ('Academic Writing', 5, 3, 'Essays and reports', 2),
        ('Advanced Syntax', 5, 3, 'Complex sentence structures', 3),
        ('Lexical Devices', 5, 3, 'Metaphor, simile, symbolism', 4),
        ('Transactional Writing', 5, 3, 'Letters, emails, applications', 5),
        ('Literature - Poetry', 5, 3, 'Deep poetry analysis', 6),
        ('Literature - Drama', 5, 3, 'Play criticism', 7),
        ('Literature - Prose', 5, 3, 'Novel analysis', 8),
        ('Oral Literature', 5, 3, 'Folklore, myths', 9),
        ('Media Studies', 5, 3, 'News and media analysis', 10),

        -- FORM 4 ENGLISH
        ('Exam Preparation', 5, 4, 'Paper 1 strategies', 1),
        ('Past Papers 1', 5, 4, 'Practice questions', 2),
        ('Past Papers 2', 5, 4, 'Practice questions', 3),
        ('Mock Exam', 5, 4, 'Trial examination', 4),

        -- FORM 1 CHICHEWA (6)
        ('Kuwunjikwa ndi Kutanthauza', 6, 1, 'Understanding words', 1),
        ('Kuwongola', 6, 1, 'Reading comprehension', 2),
        ('Kulemba Nsanja', 6, 1, 'Writing paragraphs', 3),
        ('Mawu Olako', 6, 1, 'Vocabulary building', 4),
        ('Zimene Zikusonyeza', 6, 1, 'Pronouns', 5),
        ('Khalidwe Langa', 6, 1, 'Tenses', 6),
        ('Kulemba Nkhani', 6, 1, 'Story writing', 7),
        ('Kuyankhula pa Mawu', 6, 1, 'Speaking skills', 8),
        ('Mawu a Mauthenga', 6, 1, 'Idioms', 9),
        ('Chipangano', 6, 1, 'Comparisons', 10),

        -- FORM 2 CHICHEWA
        ('Kuwunjikwa Kwapamwamba', 6, 2, 'Advanced vocabulary', 1),
        ('Kulemba Nsanja Yapamwamba', 6, 2, 'Advanced paragraphs', 2),
        ('Khalidwe', 6, 2, 'Verb conjugation', 3),
        ('Zilankhulo', 6, 2, 'Figures of speech', 4),
        ('Kulemba Nkhani Yapamwamba', 6, 2, 'Advanced story writing', 5),
        ('Mawu a Mizere', 6, 2, 'Proverbs', 6),
        ('Kuyankhula', 6, 2, 'Oral presentations', 7),
        ('Kuwunika Nkhani', 6, 2, 'Analyzing texts', 8),
        ('Chikumbutso', 6, 2, 'Recount writing', 9),
        ('Kupanga', 6, 2, 'Planning writing', 10),

        -- FORM 3 CHICHEWA
        ('Kuwunika Kwapamwamba', 6, 3, 'Critical reading', 1),
        ('Kulemba Lupelelo', 6, 3, 'Essay writing', 2),
        ('Mawu a Maluso', 6, 3, 'Literary terms', 3),
        ('Ndime Zapamwamba', 6, 3, 'Complex sentences', 4),
        ('Kulemba Nkhani Yowerengeka', 6, 3, 'Narrative essays', 5),
        ('Kulemba Zolemba', 6, 3, 'Letter writing', 6),
        ('Mawu a Kafukufuku', 6, 3, 'Research vocabulary', 7),
        ('Kuyankhula pa Gulu', 6, 3, 'Group discussions', 8),
        ('Nthano', 6, 3, 'Short stories', 9),
        ('Ma References', 6, 3, 'Citations', 10),

        -- FORM 4 CHICHEWA
        ('Kuyesa', 6, 4, 'Exam preparation', 1),
        ('Mawu 1', 6, 4, 'Practice questions', 2),
        ('Mawu 2', 6, 4, 'Practice questions', 3),
        ('Kuyesa Koyamba', 6, 4, 'Mock exam', 4),

        -- FORM 1 HISTORY (7)
        ('Introduction to History', 7, 1, 'What is history?', 1),
        ('Early Man', 7, 1, 'Stone Age, Bronze Age', 2),
        ('Ancient Civilizations', 7, 1, 'Egypt, Mesopotamia', 3),
        ('Kingdoms of Africa', 7, 1, 'Mali, Songhai, Great Zimbabwe', 4),
        ('The Shona Kingdom', 7, 1, 'Great Zimbabwe', 5),
        ('The Ndebele Kingdom', 7, 1, 'Ndebele history', 6),
        ('Colonialism', 7, 1, 'European colonization', 7),
        ('Slave Trade', 7, 1, 'Transatlantic slave trade', 8),
        ('Missionaries in Africa', 7, 1, 'Christian missions', 9),
        ('Resistance to Colonial Rule', 7, 1, 'African resistance', 10),

        -- FORM 2 HISTORY
        ('Colonial Administration', 7, 2, 'British colonial system', 1),
        ('Effects of Colonialism', 7, 2, 'Economic and social impacts', 2),
        ('Rise of Nationalism', 7, 2, 'African nationalism', 3),
        ('Independence Movements', 7, 2, 'African independence', 4),
        ('Malawi History', 7, 2, 'Dr. Kamuzu Banda', 5),
        ('One Party State', 7, 2, 'DPP era', 6),
        ('Democratic Transition', 7, 2, 'Multi-party politics', 7),
        ('Cold War', 7, 2, 'Global superpowers', 8),
        ('Pan-Africanism', 7, 2, 'African unity', 9),
        ('Human Rights', 7, 2, 'International human rights', 10),

        -- FORM 3 HISTORY
        ('World War I', 8, 3, 'Causes and effects', 1),
        ('World War II', 8, 3, 'Global conflict', 2),
        ('The Cold War Era', 8, 3, 'USA vs USSR', 3),
        ('Decolonization', 8, 3, 'African independence wave', 4),
        ('SADC History', 8, 3, 'Southern Africa cooperation', 5),
        ('UN and AU', 8, 3, 'International organizations', 6),
        ('Globalization', 8, 3, 'World economy', 7),
        ('Terrorism', 8, 3, 'Modern terrorism', 8),
        ('Climate Change', 8, 3, 'Environmental history', 9),
        ('Contemporary Issues', 8, 3, 'Modern world challenges', 10),

        -- FORM 4 HISTORY
        ('Comprehensive Revision', 7, 4, 'All topics review', 1),
        ('Past Papers 1', 7, 4, 'Practice questions', 2),
        ('Past Papers 2', 7, 4, 'Practice questions', 3),
        ('Mock Exam', 7, 4, 'Trial exam', 4),

        -- FORM 1 GEOGRAPHY (8)
        ('Introduction to Geography', 8, 1, 'What is geography?', 1),
        ('The Earth', 8, 1, 'Shape, structure, movements', 2),
        ('Map Reading', 8, 1, 'Using maps and compasses', 3),
        ('Weather & Climate', 8, 1, 'Climate zones', 4),
        ('Rivers', 8, 1, 'River features', 5),
        ('Lakes', 8, 1, 'Lake formation', 6),
        ('Mountains', 8, 1, 'Mountain formation', 7),
        ('Volcanoes', 8, 1, 'Volcanic activity', 8),
        ('Population', 8, 1, 'Population distribution', 9),
        ('Settlement', 8, 1, 'Types of settlements', 10),

        -- FORM 2 GEOGRAPHY
        ('Weathering', 9, 2, 'Weathering processes', 1),
        ('Erosion', 9, 2, 'Erosion by water and wind', 2),
        ('Climate Change', 9, 2, 'Global warming', 3),
        ('Natural Disasters', 9, 2, 'Earthquakes, tsunamis', 4),
        ('Agriculture', 9, 2, 'Farming types', 5),
        ('Industry', 9, 2, 'Manufacturing', 6),
        ('Tourism', 9, 2, 'Travel industry', 7),
        ('Mining', 9, 2, 'Mineral extraction', 8),
        ('Trade', 9, 2, 'International trade', 9),
        ('Transport', 9, 2, 'Transportation systems', 10),

        -- FORM 3 GEOGRAPHY
        ('Regional Geography', 8, 3, 'World regions', 1),
        ('Africa', 8, 3, 'African geography', 2),
        ('Malawi Geography', 8, 3, 'Physical and human', 3),
        ('Climate Regions', 8, 3, 'Tropical, temperate', 4),
        ('Vegetation', 8, 3, 'Forest, grassland, desert', 5),
        ('Soils', 8, 3, 'Soil types and formation', 6),
        ('Water Resources', 8, 3, 'Lakes, rivers, dams', 7),
        ('Urbanization', 8, 3, 'City growth', 8),
        ('Development', 8, 3, 'Economic development', 9),
        ('Environment', 8, 3, 'Conservation', 10),

        -- FORM 4 GEOGRAPHY
        ('Exam Preparation', 8, 4, 'Paper 1 strategies', 1),
        ('Map Work Practice', 8, 4, 'Topographic maps', 2),
        ('Past Papers', 8, 4, 'Practice questions', 3),
        ('Mock Exam', 8, 4, 'Trial exam', 4),

        -- FORM 1 AGRICULTURE (9)
        ('Introduction to Agriculture', 9, 1, 'What is agriculture?', 1),
        ('Crop Production', 9, 1, 'Growing crops', 2),
        ('Animal Husbandry', 9, 1, 'Keeping livestock', 3),
        ('Soil Science', 9, 1, 'Soil types and management', 4),
        ('Farm Tools', 9, 1, 'Equipment use', 5),
        ('Pests & Diseases', 9, 1, 'Crop protection', 6),
        ('Irrigation', 9, 1, 'Watering crops', 7),
        ('Fertilizers', 9, 1, 'Plant nutrition', 8),
        ('Harvesting', 9, 1, 'Post-harvest handling', 9),
        ('Farm Management', 9, 1, 'Running a farm', 10),

        -- FORM 2 AGRICULTURE
        ('Advanced Crop Production', 9, 2, 'Cash crops', 1),
        ('Livestock Management', 9, 2, 'Cattle, goats, poultry', 2),
        ('Poultry Keeping', 9, 2, 'Chicken farming', 3),
        ('Crop Rotation', 9, 2, 'Planning crops', 4),
        ('Pest Control', 9, 2, 'Integrated pest management', 5),
        ('Organic Farming', 9, 2, 'Natural agriculture', 6),
        ('Farm Structures', 9, 2, 'Fencing, storage', 7),
        ('Agricultural Economics', 9, 2, 'Farm costs and profits', 8),
        ('Value Addition', 9, 2, 'Processing produce', 9),
        ('Climate and Agriculture', 9, 2, 'Weather effects', 10),

        -- FORM 3 AGRICULTURE
        ('Agronomy', 10, 3, 'Crop science', 1),
        ('Animal Science', 10, 3, 'Livestock science', 2),
        ('Soil and Water', 10, 3, 'Conservation', 3),
        ('Agribusiness', 10, 3, 'Farm business', 4),
        ('Horticulture', 10, 3, 'Vegetable growing', 5),
        ('Forestry', 10, 3, 'Tree growing', 6),
        ('Fisheries', 10, 3, 'Fish farming', 7),
        ('Research Methods', 10, 3, 'Agricultural research', 8),
        ('Extension Services', 10, 3, 'Farmer education', 9),
        ('Sustainable Farming', 10, 3, 'Environmental practices', 10),

        -- FORM 4 AGRICULTURE
        ('Revision', 9, 4, 'All topics review', 1),
        ('Past Papers', 9, 4, 'Practice questions', 2),
        ('Mock Exam', 9, 4, 'Trial exam', 3),

        -- FORM 1 COMPUTER STUDIES (10)
        ('Introduction to Computers', 10, 1, 'What is a computer?', 1),
        ('Computer Hardware', 10, 1, 'CPU, memory, storage', 2),
        ('Input & Output Devices', 10, 1, 'Keyboard, mouse, printer', 3),
        ('Software', 10, 1, 'Applications and systems', 4),
        ('Operating Systems', 10, 1, 'Windows, Linux', 5),
        ('Word Processing', 10, 1, 'Microsoft Word basics', 6),
        ('Spreadsheets', 10, 1, 'Excel basics', 7),
        ('Internet', 10, 1, 'Browsing, email', 8),
        ('Computer Ethics', 10, 1, 'Responsible use', 9),
        ('File Management', 10, 1, 'Organizing files', 10),

        -- FORM 2 COMPUTER STUDIES
        ('Programming Concepts', 10, 2, 'Introduction to coding', 1),
        ('HTML Basics', 10, 2, 'Web page creation', 2),
        ('Database Concepts', 10, 2, 'Data organization', 3),
        ('Microsoft Access', 10, 2, 'Creating databases', 4),
        ('Graphics', 10, 2, 'Image editing basics', 5),
        ('Networking', 10, 2, 'LAN, internet', 6),
        ('Data Representation', 10, 2, 'Binary, hex', 7),
        ('Computer Security', 10, 2, 'Viruses, protection', 8),
        ('Algorithms', 10, 2, 'Problem solving', 9),
        ('Web Development', 10, 2, 'HTML and CSS', 10),

        -- FORM 3 COMPUTER STUDIES
        ('Advanced Programming', 10, 3, 'Python or JavaScript', 1),
        ('Database Management', 10, 3, 'SQL basics', 2),
        ('Object Oriented Programming', 10, 3, 'Classes and objects', 3),
        ('Web Programming', 10, 3, 'Dynamic websites', 4),
        ('Data Structures', 10, 3, 'Arrays, lists, stacks', 5),
        ('Computer Systems', 10, 3, 'Architecture', 6),
        ('Networks', 10, 3, 'Network types', 7),
        ('Cyber Security', 10, 3, 'Protecting systems', 8),
        ('Mobile Apps', 10, 3, 'App development', 9),
        ('Cloud Computing', 10, 3, 'Online services', 10),

        -- FORM 4 COMPUTER STUDIES
        ('Programming Project', 10, 4, 'Complete project', 1),
        ('Past Papers', 10, 4, 'Practice questions', 2),
        ('Mock Exam', 10, 4, 'Trial exam', 3),

        -- FORM 1 BUSINESS STUDIES (11)
        ('Introduction to Business', 11, 1, 'What is business?', 1),
        ('Types of Businesses', 11, 1, 'Sole trader, partnership', 2),
        ('Business Environment', 11, 1, 'Internal and external', 3),
        ('Business Goals', 11, 1, 'Objectives and mission', 4),
        ('Marketing', 11, 1, 'Basic marketing concepts', 5),
        ('Customers', 11, 1, 'Meeting customer needs', 6),
        ('Products', 11, 1, 'Goods and services', 7),
        ('Pricing', 11, 1, 'Setting prices', 8),
        ('Promotion', 11, 1, 'Advertising basics', 9),
        ('Record Keeping', 11, 1, 'Basic bookkeeping', 10),

        -- FORM 2 BUSINESS STUDIES
        ('Business Organizations', 11, 2, 'Companies, franchises', 1),
        ('Management', 11, 2, 'Functions of management', 2),
        ('Leadership', 11, 2, 'Business leaders', 3),
        ('Human Resources', 11, 2, 'Recruitment, training', 4),
        ('Accounting', 11, 2, 'Double entry', 5),
        ('Financial Statements', 11, 2, 'Income statement, balance sheet', 6),
        ('Budgeting', 11, 2, 'Planning finances', 7),
        ('Banking', 11, 2, 'Bank services', 8),
        ('Insurance', 11, 2, 'Business insurance', 9),
        ('Government & Business', 11, 2, 'Regulations', 10),

        -- FORM 3 BUSINESS STUDIES
        ('Business Strategy', 11, 3, 'Planning and strategy', 1),
        ('Financial Management', 11, 3, 'Managing money', 2),
        ('Investment', 11, 3, 'Business investment', 3),
        ('International Trade', 11, 3, 'Exports and imports', 4),
        ('E-Commerce', 11, 3, 'Online business', 5),
        ('Entrepreneurship', 11, 3, 'Starting a business', 6),
        ('Business Ethics', 11, 3, 'Social responsibility', 7),
        ('Risk Management', 11, 3, 'Identifying risks', 8),
        ('Business Communication', 11, 3, 'Professional communication', 9),
        ('Technology in Business', 11, 3, 'Digital transformation', 10),

        -- FORM 4 BUSINESS STUDIES
        ('Revision', 11, 4, 'All topics review', 1),
        ('Past Papers', 11, 4, 'Practice questions', 2),
        ('Mock Exam', 11, 4, 'Trial exam', 3),

        -- FORM 1 RELIGIOUS EDUCATION (12)
        ('Introduction to Religion', 12, 1, 'What is religion?', 1),
        ('Origin of Faiths', 12, 1, 'World religions', 2),
        ('Christianity', 12, 1, 'Basic beliefs', 3),
        ('Islam', 12, 1, 'Basic beliefs', 4),
        ('African Traditional Religion', 12, 1, 'Ancestors, spirits', 5),
        ('Places of Worship', 12, 1, 'Church, mosque, shrine', 6),
        ('Religious Leaders', 12, 1, 'Prophets, priests', 7),
        ('Sacred Texts', 12, 1, 'Bible, Quran, traditions', 8),
        ('Prayer & Worship', 12, 1, 'How to worship', 9),
        ('Morality', 12, 1, 'Ethical living', 10),

        -- FORM 2 RELIGIOUS EDUCATION
        ('Old Testament', 12, 2, 'Genesis, Exodus', 1),
        ('New Testament', 12, 2, 'Gospels', 2),
        ('The Prophets', 12, 2, 'Major prophets', 3),
        ('The Life of Jesus', 12, 2, 'Jesus teachings', 4),
        ('Christian Values', 12, 2, 'Love, compassion', 5),
        ('Islamic Practices', 12, 2, 'Five pillars', 6),
        ('African Values', 12, 2, 'Traditional morals', 7),
        ('Interfaith', 12, 2, 'Living together', 8),
        ('Religious Rites', 12, 2, 'Weddings, funerals', 9),
        ('Community Service', 12, 2, 'Helping others', 10),

        -- FORM 3 RELIGIOUS EDUCATION
        ('Comparative Religion', 12, 3, 'Comparing faiths', 1),
        ('Philosophy of Religion', 12, 3, 'Does God exist?', 2),
        ('Religious Ethics', 12, 3, 'Moral dilemmas', 3),
        ('Modern Issues', 12, 3, 'Bioethics, poverty', 4),
        ('Religious Freedom', 12, 3, 'Human rights', 5),
        ('Secularism', 12, 3, 'Religion and state', 6),
        ('Global Religions', 12, 3, 'World faiths today', 7),
        ('Religious Conflicts', 12, 3, 'Peace building', 8),
        ('Interreligious Dialogue', 12, 3, 'Unity in diversity', 9),
        ('Contemporary Faith', 12, 3, 'Modern believers', 10),

        -- FORM 4 RELIGIOUS EDUCATION
        ('Revision', 12, 4, 'All topics review', 1),
        ('Past Papers', 12, 4, 'Practice questions', 2),
        ('Mock Exam', 12, 4, 'Trial exam', 3)
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
