-- Run this if the admin user already exists with a bad/placeholder password.
-- Password after update: Admin@1234
-- Login with email admin@malawieduhub.mw OR phone +265888227462

UPDATE users
SET password_hash = '$2a$12$K2PbuTCwu5qTERMb9AZdy.LsLPFGatfN/jwaOM11WGj7HfTNvgBUG'
WHERE email = 'admin@malawieduhub.mw';
