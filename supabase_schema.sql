-- AthleteOS: Supabase Database Schema

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  weight_kg FLOAT,
  height_cm FLOAT,
  sport TEXT,
  training_goal TEXT,
  experience_level TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. Workouts Table
CREATE TABLE workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  sport TEXT,
  notes TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Exercise Sessions Table
CREATE TABLE exercise_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES workouts ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  quality TEXT,
  "order" INTEGER NOT NULL
);

-- 4. Sets Table
CREATE TABLE sets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES exercise_sessions ON DELETE CASCADE NOT NULL,
  weight FLOAT,
  reps INTEGER,
  rpe INTEGER,
  e1rm FLOAT,
  "order" INTEGER NOT NULL
);

-- 5. Biomarkers Table
CREATE TABLE biomarkers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  name TEXT NOT NULL,
  value FLOAT NOT NULL,
  category TEXT,
  unit TEXT
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE biomarkers ENABLE ROW LEVEL SECURITY;

-- Logic for RLS: Users can only see/edit their own data
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own workouts" ON workouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own exercise_sessions" ON exercise_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM workouts WHERE id = exercise_sessions.workout_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own sets" ON sets FOR ALL USING (
  EXISTS (SELECT 1 FROM exercise_sessions es JOIN workouts w ON es.workout_id = w.id WHERE es.id = sets.session_id AND w.user_id = auth.uid())
);
CREATE POLICY "Users can manage their own biomarkers" ON biomarkers FOR ALL USING (auth.uid() = user_id);
