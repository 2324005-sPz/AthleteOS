// ============================================================
//  DATA.JS — Exercise Library, Biomarker Definitions, Sports
// ============================================================

export const SPORTS = [
    "General Fitness", "Powerlifting", "Olympic Weightlifting", "Bodybuilding",
    "CrossFit", "Football", "Basketball", "Soccer", "Tennis", "Rugby", "MMA / BJJ",
    "Boxing", "Wrestling", "Gymnastics", "Swimming", "Cycling", "Running / Track",
    "Rowing", "Volleyball", "Baseball", "American Football", "Triathlon", "Climbing",
    "Calisthenics", "Sprinting", "Long Jump / High Jump", "Throwing Events",
    "Hockey", "Golf", "Skiing / Snowboarding", "Custom"
];

export const GOALS = [
    "Build Muscle (Hypertrophy)",
    "Increase Maximal Strength",
    "Develop Power & Explosiveness",
    "Improve Speed & Agility",
    "Build Aerobic Endurance",
    "Improve Body Composition",
    "Enhance Mobility & Flexibility",
    "Athletic Performance (Sport-Specific)",
    "General Health & Fitness",
    "Muscular Endurance",
    "Skill Development"
];

export const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Elite"];

export const ATHLETIC_QUALITIES = [
    "Maximal Strength",
    "Relative Strength",
    "Power / Explosiveness",
    "Speed & Agility",
    "Aerobic Endurance",
    "Anaerobic Capacity",
    "Muscular Endurance",
    "Mobility & Flexibility",
    "Skill & Coordination",
    "Body Composition",
    "Recovery & Wellness"
];

// ─── Biomarker categories ────────────────────────────────────
export const BIOMARKER_CATEGORIES = {
    "Body Composition": [
        { name: "Body Weight", unit: "kg", icon: "⚖️", description: "Total body mass" },
        { name: "Body Fat %", unit: "%", icon: "🫀", description: "Estimated body fat percentage" },
        { name: "Lean Mass", unit: "kg", icon: "💪", description: "Fat-free mass estimate" },
        { name: "Waist Circumference", unit: "cm", icon: "📏", description: "Waist measurement" },
        { name: "Hip Circumference", unit: "cm", icon: "📏", description: "Hip measurement" },
        { name: "Chest Circumference", unit: "cm", icon: "📏", description: "Chest measurement" },
        { name: "Arm Circumference", unit: "cm", icon: "💪", description: "Upper arm measurement" },
        { name: "Thigh Circumference", unit: "cm", icon: "📏", description: "Thigh measurement" },
    ],
    "Strength Markers": [
        { name: "Squat 1RM", unit: "kg", icon: "🏋️", description: "Back squat 1-rep max" },
        { name: "Bench Press 1RM", unit: "kg", icon: "🏋️", description: "Bench press 1-rep max" },
        { name: "Deadlift 1RM", unit: "kg", icon: "🏋️", description: "Deadlift 1-rep max" },
        { name: "Overhead Press 1RM", unit: "kg", icon: "🏋️", description: "OHP 1-rep max" },
        { name: "Total (SBD)", unit: "kg", icon: "🏆", description: "Squat + Bench + Deadlift total" },
        { name: "Wilks Score", unit: "pts", icon: "📊", description: "Strength relative to bodyweight" },
        { name: "Grip Strength", unit: "kg", icon: "🤝", description: "Dynamometer grip test" },
    ],
    "Power & Speed": [
        { name: "Vertical Jump", unit: "cm", icon: "⚡", description: "Countermovement jump height" },
        { name: "Broad Jump", unit: "cm", icon: "⚡", description: "Standing broad/long jump" },
        { name: "30m Sprint", unit: "s", icon: "💨", description: "30-meter sprint time" },
        { name: "10m Sprint", unit: "s", icon: "💨", description: "10-meter sprint (explosive start)" },
        { name: "100m Sprint", unit: "s", icon: "💨", description: "100m personal best" },
        { name: "T-Test Agility", unit: "s", icon: "🔄", description: "T-test agility run time" },
        { name: "Power Clean 1RM", unit: "kg", icon: "⚡", description: "Power clean 1-rep max" },
        { name: "Snatch 1RM", unit: "kg", icon: "⚡", description: "Full snatch 1-rep max" },
    ],
    "Endurance Metrics": [
        { name: "VO2 Max (estimated)", unit: "ml/kg/min", icon: "🫁", description: "Aerobic capacity estimate" },
        { name: "Resting Heart Rate", unit: "bpm", icon: "❤️", description: "Morning resting HR" },
        { name: "HRV (RMSSD)", unit: "ms", icon: "📈", description: "Heart rate variability" },
        { name: "5K Run Time", unit: "min", icon: "🏃", description: "5km personal best" },
        { name: "10K Run Time", unit: "min", icon: "🏃", description: "10km personal best" },
        { name: "Lactate Threshold HR", unit: "bpm", icon: "🫀", description: "HR at lactate threshold" },
        { name: "Max Aerobic Speed", unit: "km/h", icon: "🚀", description: "Speed at VO2max" },
    ],
    "Recovery & Wellness": [
        { name: "Sleep Duration", unit: "hrs", icon: "😴", description: "Total sleep hours" },
        { name: "Sleep Quality", unit: "/10", icon: "⭐", description: "Subjective sleep quality" },
        { name: "Energy Level", unit: "/10", icon: "⚡", description: "Subjective energy (1-10)" },
        { name: "Muscle Soreness", unit: "/10", icon: "😣", description: "DOMS level (1=none, 10=extreme)" },
        { name: "Stress Level", unit: "/10", icon: "🧠", description: "Perceived stress (1-10)" },
        { name: "Mood", unit: "/10", icon: "😊", description: "Overall mood score" },
        { name: "Readiness Score", unit: "/10", icon: "🎯", description: "Overall training readiness" },
    ],
    "Mobility & Flexibility": [
        { name: "Sit & Reach", unit: "cm", icon: "🤸", description: "Hamstring flexibility test" },
        { name: "Shoulder Rotation", unit: "°", icon: "🤸", description: "Internal/external rotation ROM" },
        { name: "Hip Flexor ROM", unit: "°", icon: "🤸", description: "Hip flexor flexibility" },
        { name: "Ankle Dorsiflexion", unit: "°", icon: "🦶", description: "Ankle ROM assessment" },
        { name: "Thoracic Rotation", unit: "°", icon: "🤸", description: "T-spine rotational ROM" },
        { name: "FMS Score", unit: "/21", icon: "📋", description: "Functional Movement Screen total" },
    ]
};

// ─── Exercise Library ────────────────────────────────────────
export const EXERCISE_LIBRARY = [
    // STRENGTH
    { name: "Back Squat", quality: "Maximal Strength", muscles: ["Quads", "Glutes", "Hamstrings", "Core"], equipment: "Barbell", instructions: "Bar on traps, squat to below parallel, drive through heels." },
    { name: "Front Squat", quality: "Maximal Strength", muscles: ["Quads", "Core", "Upper Back"], equipment: "Barbell", instructions: "Bar in front rack, elbows high, upright torso." },
    { name: "Deadlift", quality: "Maximal Strength", muscles: ["Posterior Chain", "Traps", "Grip"], equipment: "Barbell", instructions: "Hip hinge, neutral spine, bar close to body." },
    { name: "Romanian Deadlift", quality: "Relative Strength", muscles: ["Hamstrings", "Glutes", "Lower Back"], equipment: "Barbell", instructions: "Hip hinge, slight knee bend, feel hamstring stretch." },
    { name: "Bench Press", quality: "Maximal Strength", muscles: ["Chest", "Triceps", "Front Delt"], equipment: "Barbell", instructions: "Arch back, retract scapula, lower to chest, drive up." },
    { name: "Overhead Press", quality: "Maximal Strength", muscles: ["Shoulders", "Triceps", "Core"], equipment: "Barbell", instructions: "Press from chin level, full lockout overhead." },
    { name: "Barbell Row", quality: "Relative Strength", muscles: ["Lats", "Rhomboids", "Biceps"], equipment: "Barbell", instructions: "Hinge 45°, pull bar to lower ribs." },
    { name: "Pull-Up", quality: "Relative Strength", muscles: ["Lats", "Biceps", "Core"], equipment: "Bodyweight", instructions: "Full dead hang, pull chin over bar." },
    { name: "Weighted Pull-Up", quality: "Maximal Strength", muscles: ["Lats", "Biceps"], equipment: "Bodyweight+Belt", instructions: "Add load via belt, full ROM." },
    { name: "Dip", quality: "Relative Strength", muscles: ["Chest", "Triceps", "Front Delt"], equipment: "Parallel Bars", instructions: "Controlled descent, press to lockout." },
    { name: "Bulgarian Split Squat", quality: "Relative Strength", muscles: ["Quads", "Glutes", "Adductors"], equipment: "Dumbbells/Barbell", instructions: "Rear foot elevated, deep lunge position." },
    { name: "Leg Press", quality: "Maximal Strength", muscles: ["Quads", "Glutes", "Hamstrings"], equipment: "Machine", instructions: "Feet shoulder-width, full ROM, don't lock knees at top." },
    { name: "Hip Thrust", quality: "Relative Strength", muscles: ["Glutes", "Hamstrings"], equipment: "Barbell", instructions: "Shoulders on bench, drive hips up to full extension." },
    // POWER
    { name: "Power Clean", quality: "Power / Explosiveness", muscles: ["Full Body"], equipment: "Barbell", instructions: "Explosive hip extension, catch in quarter-squat rack position." },
    { name: "Hang Clean", quality: "Power / Explosiveness", muscles: ["Full Body"], equipment: "Barbell", instructions: "From hang above knee, explosive triple extension." },
    { name: "Snatch", quality: "Power / Explosiveness", muscles: ["Full Body"], equipment: "Barbell", instructions: "Wide grip, pull under, catch overhead in squat." },
    { name: "Push Press", quality: "Power / Explosiveness", muscles: ["Shoulders", "Triceps", "Legs"], equipment: "Barbell", instructions: "Dip and drive, use leg drive to initiate press." },
    { name: "Box Jump", quality: "Power / Explosiveness", muscles: ["Quads", "Glutes", "Calves"], equipment: "Box", instructions: "Swing arms, explode up, land softly on box." },
    { name: "Broad Jump", quality: "Power / Explosiveness", muscles: ["Quads", "Glutes", "Calves"], equipment: "Bodyweight", instructions: "Swing arms horizontally, jump as far as possible, stick landing." },
    { name: "Medicine Ball Slam", quality: "Power / Explosiveness", muscles: ["Core", "Shoulders", "Arms"], equipment: "Med Ball", instructions: "Raise overhead, slam powerfully to ground." },
    { name: "Kettlebell Swing", quality: "Power / Explosiveness", muscles: ["Posterior Chain", "Core"], equipment: "Kettlebell", instructions: "Hip hinge drive, not a squat; bell floats from hip snap." },
    { name: "Depth Drop", quality: "Power / Explosiveness", muscles: ["Legs", "Core"], equipment: "Box", instructions: "Step off box, land and immediately minimize contact time." },
    // SPEED & AGILITY
    { name: "Sprint Intervals (30m)", quality: "Speed & Agility", muscles: ["Full Body"], equipment: "Bodyweight", instructions: "Maximum effort 30m sprints with full recovery." },
    { name: "Sled Push", quality: "Speed & Agility", muscles: ["Quads", "Glutes", "Calves"], equipment: "Sled", instructions: "Drive forward, full hip extension, pump arms." },
    { name: "Cone Drills (T-Test)", quality: "Speed & Agility", muscles: ["Full Body"], equipment: "Cones", instructions: "Sprint, shuffle, and backpedal between cones for agility." },
    { name: "Lateral Bounds", quality: "Speed & Agility", muscles: ["Glutes", "Adductors", "Calves"], equipment: "Bodyweight", instructions: "Single-leg lateral jumps, stick each landing." },
    { name: "Resisted Sprints", quality: "Speed & Agility", muscles: ["Full Body"], equipment: "Band/Sled", instructions: "Sprint against resistance for 10-20m." },
    // ENDURANCE
    { name: "Tempo Run", quality: "Aerobic Endurance", muscles: ["Full Body"], equipment: "Bodyweight", instructions: "Sustained effort at lactate threshold pace." },
    { name: "Long Slow Distance Run", quality: "Aerobic Endurance", muscles: ["Full Body"], equipment: "Bodyweight", instructions: "Easy conversational pace for 30-90 min." },
    { name: "Row Ergometer", quality: "Aerobic Endurance", muscles: ["Full Body"], equipment: "Rowing Machine", instructions: "Maintain consistent split times." },
    { name: "Assault Bike HIIT", quality: "Anaerobic Capacity", muscles: ["Full Body"], equipment: "Assault Bike", instructions: "All-out 20s / rest 40s cycles." },
    { name: "Hill Sprints", quality: "Anaerobic Capacity", muscles: ["Full Body"], equipment: "Bodyweight", instructions: "Maximum effort uphill sprints, walk down for recovery." },
    { name: "Battle Ropes", quality: "Muscular Endurance", muscles: ["Shoulders", "Core", "Arms"], equipment: "Battle Ropes", instructions: "Continuous alternating waves for prescribed duration." },
    // MOBILITY
    { name: "Hip 90/90 Stretch", quality: "Mobility & Flexibility", muscles: ["Hip Rotators", "Glutes"], equipment: "Bodyweight", instructions: "Sit in 90/90 position, lean forward over front leg." },
    { name: "World's Greatest Stretch", quality: "Mobility & Flexibility", muscles: ["Hip Flexors", "Thoracic Spine", "Hamstrings"], equipment: "Bodyweight", instructions: "Lunge + rotation + reach sequence." },
    { name: "Couch Stretch", quality: "Mobility & Flexibility", muscles: ["Hip Flexors", "Quads"], equipment: "Bodyweight", instructions: "Rear foot against wall in kneeling lunge." },
    { name: "Thoracic Extension on Roller", quality: "Mobility & Flexibility", muscles: ["Thoracic Spine"], equipment: "Foam Roller", instructions: "Roller under thoracic spine, extend backward." },
    { name: "Pigeon Pose", quality: "Mobility & Flexibility", muscles: ["Piriformis", "Glutes", "Hip Rotators"], equipment: "Bodyweight", instructions: "Front leg at 90°, sink hips toward floor." },
    // MUSCLE ENDURANCE
    { name: "Push-Up", quality: "Muscular Endurance", muscles: ["Chest", "Triceps", "Shoulders"], equipment: "Bodyweight", instructions: "Full ROM, maintain plank position." },
    { name: "Plank", quality: "Muscular Endurance", muscles: ["Core", "Shoulders"], equipment: "Bodyweight", instructions: "Neutral spine, active core, hold for time." },
    { name: "Farmer's Carry", quality: "Muscular Endurance", muscles: ["Forearms", "Traps", "Core"], equipment: "Dumbbells/Handles", instructions: "Heavy load, tall posture, walk prescribed distance." },
];

export const RPE_DESCRIPTIONS = {
    6: "No effort — could talk easily",
    7: "Very light — barely working",
    7.5: "Light — comfortable with reserve",
    8: "Moderate — 2-3 reps left in tank",
    8.5: "Hard — 1-2 reps left",
    9: "Very hard — 1 rep left in tank",
    9.5: "Near maximal effort",
    10: "Absolute maximum — true PR attempt"
};
