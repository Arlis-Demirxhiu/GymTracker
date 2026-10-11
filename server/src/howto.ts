/**
 * How to do each catalog exercise: what to set up (which machine, bench angle,
 * grip) and a few form cues. Short on purpose — the linked videos show the
 * movement; this is the checklist to read between sets.
 */

export type HowTo = {
  /** The equipment and how to set it up, or where to stand. */
  setup: string;
  /** Form cues in the order you'd think of them during a rep. */
  steps: string[];
};

const h = (setup: string, ...steps: string[]): HowTo => ({ setup, steps });

export const HOW_TO: Record<string, HowTo> = {
  // chest
  'bench-press': h(
    'Flat bench with a barbell in the rack at arm’s length when lying down. Use safety arms or a spotter.',
    'Lie with eyes under the bar, feet flat, shoulder blades pinched together.',
    'Grip just wider than shoulders, unrack and lower the bar to mid-chest.',
    'Press up and slightly back until your arms are straight.',
  ),
  'incline-db-press': h(
    'Bench set to about 30–45°, a dumbbell in each hand.',
    'Sit back with the dumbbells at shoulder height, palms forward.',
    'Press up and slightly together until arms are straight.',
    'Lower slowly until the dumbbells are level with your upper chest.',
  ),
  dips: h(
    'Parallel dip bars.',
    'Hold yourself up with straight arms, lean your chest forward.',
    'Bend your elbows and lower until your shoulders are just below your elbows.',
    'Push back up without locking out hard.',
  ),
  'db-floor-press': h(
    'Lie on the floor with a dumbbell in each hand — no bench needed.',
    'Knees bent, elbows on the floor at about 45° from your body.',
    'Press the dumbbells up until your arms are straight.',
    'Lower until your upper arms touch the floor, pause, repeat.',
  ),
  'push-up': h(
    'Floor only. Hands slightly wider than shoulders.',
    'Hold a straight line from head to heels, abs tight.',
    'Lower your chest to just above the floor, elbows at about 45°.',
    'Push the floor away until your arms are straight.',
  ),
  'decline-push-up': h(
    'Feet on a chair, bench or step; hands on the floor.',
    'Keep your body in one straight line.',
    'Lower your chest towards the floor.',
    'Press back up — the higher your feet, the harder it gets.',
  ),
  'cable-fly': h(
    'Cable station with both pulleys at shoulder height and handles attached.',
    'Step forward, slight bend in the elbows, arms open wide.',
    'Bring the handles together in front of your chest in an arc.',
    'Open back out slowly until you feel a stretch across your chest.',
  ),
  'pec-deck': h(
    'Pec deck (chest fly) machine. Set the seat so the handles are at chest height.',
    'Sit tall with your back against the pad and grip the handles.',
    'Squeeze the handles together in front of you.',
    'Let them return slowly until your chest is stretched.',
  ),
  'db-fly': h(
    'Flat bench, a light dumbbell in each hand.',
    'Lie back with the dumbbells above your chest, palms facing.',
    'With a slight bend in the elbows, lower your arms out to the sides.',
    'Squeeze them back up in the same arc.',
  ),

  // back
  'pull-up': h(
    'Pull-up bar. Grip just wider than shoulders, palms facing away.',
    'Hang with straight arms and pull your shoulders down.',
    'Pull until your chin is over the bar, leading with your chest.',
    'Lower all the way down with control.',
  ),
  'barbell-row': h(
    'Barbell on the floor or in a rack at thigh height.',
    'Hinge at the hips until your torso is about 45°, back flat.',
    'Pull the bar to your lower ribs, squeezing your shoulder blades.',
    'Lower until your arms are straight without standing up.',
  ),
  'lat-pulldown': h(
    'Lat pulldown machine. Wedge your knees under the pads, wide bar attached.',
    'Grip the bar wider than shoulders and lean back slightly.',
    'Pull the bar to your upper chest, elbows driving down.',
    'Let it rise slowly until your arms are straight.',
  ),
  'seated-row': h(
    'Seated cable row with a close-grip (V) handle. Feet on the platform, knees soft.',
    'Sit tall, arms straight, chest up.',
    'Pull the handle to your stomach, squeezing your shoulder blades together.',
    'Return slowly without rounding your back.',
  ),
  deadlift: h(
    'Loaded barbell on the floor, over the middle of your feet.',
    'Feet hip-width, grip just outside your legs, back flat, chest up.',
    'Push through the floor and stand up, keeping the bar against your legs.',
    'Hinge at the hips to lower it back down the same path.',
  ),
  'db-row': h(
    'One dumbbell; one hand and knee on a bench, or a hand on a chair.',
    'Back flat, dumbbell hanging straight down.',
    'Pull it towards your hip, elbow close to your body.',
    'Lower slowly. Do all reps, then switch sides.',
  ),
  'face-pull': h(
    'Cable station at upper-chest height with a rope attachment.',
    'Hold the rope with thumbs towards you and step back.',
    'Pull towards your face, spreading the rope apart, elbows high.',
    'Pause, then return slowly.',
  ),
  superman: h(
    'Floor or mat, lying face down.',
    'Arms stretched in front, legs straight.',
    'Lift your arms, chest and legs off the floor together.',
    'Hold for the time, breathing steadily, then lower.',
  ),

  // shoulders
  'overhead-press': h(
    'Barbell in a rack at upper-chest height.',
    'Grip just outside shoulders, bar resting on your front shoulders.',
    'Squeeze glutes and abs, press the bar straight overhead.',
    'Move your head back as it passes, then through once it’s up. Lower slowly.',
  ),
  'db-shoulder-press': h(
    'A dumbbell in each hand; sitting on a bench with a back rest, or standing.',
    'Start with the dumbbells at shoulder height, palms forward.',
    'Press up until your arms are straight.',
    'Lower back to shoulder height.',
  ),
  'arnold-press': h(
    'A dumbbell in each hand, seated or standing.',
    'Start with the dumbbells in front of your shoulders, palms facing you.',
    'Rotate your palms forward as you press overhead.',
    'Reverse the rotation on the way down.',
  ),
  'pike-push-up': h(
    'Floor. Hands and feet down, hips high so your body makes an upside-down V.',
    'Bend your elbows and lower the top of your head towards the floor.',
    'Keep your hips high the whole time.',
    'Push back up to straight arms.',
  ),
  'lateral-raise': h(
    'A light dumbbell in each hand, standing.',
    'Arms at your sides, slight bend in the elbows.',
    'Raise your arms out to the sides up to shoulder height.',
    'Lower slowly — don’t swing.',
  ),
  'rear-delt-fly': h(
    'Light dumbbells. Hinge forward until your chest is nearly parallel to the floor.',
    'Let the dumbbells hang below your chest, slight elbow bend.',
    'Raise them out to the sides, squeezing your upper back.',
    'Lower slowly.',
  ),
  'upright-row': h(
    'Cable station with the pulley at the bottom and a straight bar.',
    'Stand close, bar in front of your thighs, hands shoulder-width.',
    'Pull the bar up to chest height, leading with your elbows.',
    'Lower slowly. Stop lower if your shoulders pinch.',
  ),

  // biceps
  'chin-up': h(
    'Pull-up bar. Shoulder-width grip, palms facing you.',
    'Hang with straight arms.',
    'Pull until your chin is over the bar.',
    'Lower all the way down with control.',
  ),
  'barbell-curl': h(
    'Barbell or EZ-bar, standing, shoulder-width underhand grip.',
    'Elbows pinned to your sides.',
    'Curl the bar up to your shoulders without swinging.',
    'Lower slowly until your arms are straight.',
  ),
  'db-curl': h(
    'A dumbbell in each hand, standing or sitting.',
    'Arms straight, palms forward.',
    'Curl up without moving your elbows forward.',
    'Lower slowly.',
  ),
  'hammer-curl': h(
    'A dumbbell in each hand, palms facing each other.',
    'Elbows tucked in at your sides.',
    'Curl the dumbbells up, keeping the thumbs-up grip.',
    'Lower slowly.',
  ),
  'incline-db-curl': h(
    'Bench at about 45°, a dumbbell in each hand.',
    'Lie back with arms hanging straight down behind your body.',
    'Curl up without bringing your elbows forward.',
    'Lower until fully stretched.',
  ),
  'preacher-curl': h(
    'Preacher curl machine or bench. Adjust the seat so your armpits sit on top of the pad.',
    'Arms on the pad, holding the handles or bar.',
    'Curl up towards your face.',
    'Lower slowly — stop just short of locking out.',
  ),
  'cable-curl': h(
    'Cable station with the pulley at the bottom and a straight bar.',
    'Stand close, elbows at your sides.',
    'Curl the bar up to your shoulders.',
    'Lower slowly against the cable.',
  ),
  'concentration-curl': h(
    'One dumbbell, sitting on a bench or chair.',
    'Brace your elbow against the inside of your thigh.',
    'Curl the dumbbell up towards your shoulder.',
    'Lower slowly, then switch arms.',
  ),

  // triceps
  'close-grip-bench': h(
    'Flat bench and barbell, like a bench press.',
    'Grip about shoulder-width, elbows tucked close.',
    'Lower the bar to your lower chest.',
    'Press up, pushing with your triceps.',
  ),
  'dip-triceps': h(
    'Parallel dip bars.',
    'Hold yourself up with straight arms, body upright.',
    'Lower until your elbows reach about 90°.',
    'Press back up to straight arms.',
  ),
  'diamond-push-up': h(
    'Floor. Hands together under your chest, thumbs and index fingers touching.',
    'Body in one straight line.',
    'Lower your chest to your hands, elbows close to your sides.',
    'Push back up.',
  ),
  skullcrusher: h(
    'Flat bench with an EZ-bar or barbell.',
    'Lie back with the bar above your chest, arms straight.',
    'Bend only your elbows to lower the bar towards your forehead.',
    'Straighten your arms back up.',
  ),
  pushdown: h(
    'Cable station with the pulley at the top and a rope or straight bar.',
    'Stand close, elbows pinned to your sides.',
    'Push down until your arms are straight.',
    'Let it rise until your forearms are just above parallel.',
  ),
  'overhead-ext': h(
    'One dumbbell held with both hands, seated or standing.',
    'Hold it overhead with straight arms.',
    'Bend your elbows to lower it behind your head.',
    'Straighten your arms to lift it back up.',
  ),
  kickback: h(
    'A light dumbbell, hinge forward with a hand on a bench or your knee.',
    'Upper arm parallel to the floor, elbow bent at 90°.',
    'Straighten your arm backwards.',
    'Bend it back to 90° slowly.',
  ),
  'chair-dip': h(
    'A sturdy chair or bench behind you, hands on its edge.',
    'Legs out in front, hips just off the seat.',
    'Bend your elbows to lower your hips towards the floor.',
    'Push back up to straight arms.',
  ),

  // forearms
  'farmers-walk': h(
    'A heavy dumbbell in each hand and some space to walk.',
    'Stand tall, shoulders back, abs tight.',
    'Walk with short, steady steps for the distance.',
    'Set the weights down with a straight back.',
  ),
  'reverse-curl': h(
    'Barbell or EZ-bar, overhand grip.',
    'Elbows at your sides, palms facing down.',
    'Curl the bar up to your shoulders.',
    'Lower slowly.',
  ),
  'wrist-curl': h(
    'A dumbbell, forearm resting on your thigh or a bench, palm up.',
    'Let your wrist bend back so the dumbbell lowers.',
    'Curl your wrist up as far as it goes.',
    'Lower slowly. Do both arms.',
  ),
  'dead-hang': h(
    'Pull-up bar, shoulder-width grip.',
    'Hang with straight arms, feet off the ground.',
    'Keep your shoulders slightly pulled down.',
    'Hold for the time, then step down.',
  ),
  'plate-pinch': h(
    'Two weight plates held smooth-side out, or one thick plate.',
    'Pinch them between fingers and thumb.',
    'Stand tall with your arm at your side.',
    'Hold for the time. Do both hands.',
  ),
  'wrist-roller': h(
    'Wrist roller machine, or a handheld roller: a bar with a rope and a small weight.',
    'Hold the bar at shoulder height, arms straight.',
    'Roll the weight up by turning the bar with your wrists.',
    'Unroll it slowly back down.',
  ),

  // abs
  'hanging-leg-raise': h(
    'Pull-up bar.',
    'Hang with straight arms and legs together.',
    'Raise your legs until they’re level with your hips, without swinging.',
    'Lower slowly.',
  ),
  'ab-wheel': h(
    'Ab wheel and a mat for your knees.',
    'Kneel with the wheel under your shoulders.',
    'Roll forward slowly, keeping your back flat.',
    'Pull back with your abs before your hips sag.',
  ),
  'cable-crunch': h(
    'Cable station with the pulley at the top and a rope attachment.',
    'Kneel facing the stack, rope beside your head.',
    'Crunch down, bringing your elbows towards your knees.',
    'Rise back up slowly — the hips stay still.',
  ),
  plank: h(
    'Floor or mat.',
    'Forearms on the floor, elbows under shoulders.',
    'Body in a straight line from head to heels, glutes and abs tight.',
    'Hold for the time — stop when your hips sag.',
  ),
  'lying-leg-raise': h(
    'Floor or mat, lying on your back.',
    'Hands under your hips, legs straight.',
    'Raise your legs until they point at the ceiling.',
    'Lower slowly without letting your back arch off the floor.',
  ),
  'russian-twist': h(
    'Floor or mat. Hold your hands together, or a weight for more challenge.',
    'Sit with knees bent, lean back slightly, feet up or down.',
    'Rotate your torso to one side, then the other.',
    'Each side counts as one rep.',
  ),
  'dead-bug': h(
    'Floor or mat, lying on your back.',
    'Arms up, knees above hips at 90°.',
    'Lower one arm and the opposite leg towards the floor.',
    'Return and switch sides, keeping your lower back on the floor.',
  ),

  // quads
  'back-squat': h(
    'Barbell in a squat rack at shoulder height. Set the safety arms.',
    'Bar on your upper back, feet shoulder-width, toes slightly out.',
    'Sit down and back until your thighs are at least parallel.',
    'Drive up through your whole foot, chest up.',
  ),
  'front-squat': h(
    'Barbell in a squat rack, resting on your front shoulders.',
    'Elbows high, feet shoulder-width.',
    'Squat down keeping your torso upright.',
    'Drive up through your whole foot.',
  ),
  'leg-press': h(
    'Leg press machine. Feet shoulder-width in the middle of the platform.',
    'Release the safety catches.',
    'Lower the platform until your knees reach about 90°.',
    'Press back up without locking your knees.',
  ),
  'goblet-squat': h(
    'One dumbbell or kettlebell held at your chest.',
    'Feet shoulder-width, toes slightly out.',
    'Squat down between your knees, chest up.',
    'Stand back up.',
  ),
  'walking-lunge': h(
    'A dumbbell in each hand and room to walk.',
    'Take a long step forward.',
    'Lower until your back knee nearly touches the floor.',
    'Push through the front foot and step into the next lunge.',
  ),
  'bulgarian-split': h(
    'A bench behind you and a dumbbell in each hand.',
    'Rest the top of your back foot on the bench.',
    'Lower straight down until your front thigh is parallel.',
    'Drive up through the front heel. Switch legs.',
  ),
  'bodyweight-squat': h(
    'Floor only.',
    'Feet shoulder-width, arms forward for balance.',
    'Sit down and back as low as feels good.',
    'Stand back up.',
  ),
  'split-squat': h(
    'Floor only, in a staggered stance.',
    'One foot forward, one back.',
    'Lower straight down until your back knee nearly touches.',
    'Push back up. Switch legs.',
  ),
  'leg-extension': h(
    'Leg extension machine. Line your knees up with the pivot and the pad on your shins.',
    'Sit back and hold the handles.',
    'Straighten your legs.',
    'Lower slowly.',
  ),

  // hamstrings
  'romanian-deadlift': h(
    'Barbell, start standing with it at your thighs.',
    'Soft knees, back flat.',
    'Push your hips back, sliding the bar down your legs until you feel your hamstrings stretch.',
    'Drive your hips forward to stand up.',
  ),
  'good-morning': h(
    'Light barbell on your upper back, as for a squat.',
    'Soft knees, back flat.',
    'Hinge forward at the hips until your torso nears parallel.',
    'Drive your hips forward to stand up.',
  ),
  'db-rdl': h(
    'A dumbbell in each hand.',
    'Soft knees, back flat.',
    'Push your hips back, lowering the dumbbells along your legs.',
    'Stand back up by squeezing your glutes.',
  ),
  'kettlebell-swing': h(
    'One kettlebell and space in front of you.',
    'Hike the kettlebell back between your legs.',
    'Snap your hips forward to swing it to chest height — the arms just hold on.',
    'Let it fall back and repeat.',
  ),
  'single-leg-rdl': h(
    'Floor only. Stand on one leg.',
    'Hinge forward, letting the other leg extend behind you.',
    'Lower until your body is near parallel to the floor.',
    'Return to standing. Switch legs.',
  ),
  'nordic-curl': h(
    'Kneel with your heels anchored under a couch, bar or partner.',
    'Body straight from knees to head.',
    'Lean forward as slowly as you can.',
    'Catch yourself with your hands and push back up.',
  ),
  'lying-leg-curl': h(
    'Lying leg curl machine. The pad sits just above your heels.',
    'Lie face down, hips pressed into the bench.',
    'Curl your heels towards your glutes.',
    'Lower slowly.',
  ),
  'seated-leg-curl': h(
    'Seated leg curl machine. Line your knees up with the pivot.',
    'Lower the thigh pad onto your legs.',
    'Curl your heels down and back.',
    'Let them return slowly.',
  ),

  // glutes
  'hip-thrust': h(
    'Bench behind you and a padded barbell over your hips.',
    'Upper back on the bench, feet flat.',
    'Drive your hips up until your body is flat from shoulders to knees.',
    'Squeeze your glutes, then lower.',
  ),
  'sumo-deadlift': h(
    'Barbell on the floor.',
    'Wide stance, toes out, grip inside your knees.',
    'Push your knees out and stand up, chest up.',
    'Lower with control.',
  ),
  'db-hip-thrust': h(
    'Bench behind you and a dumbbell on your hips.',
    'Upper back on the bench, feet flat.',
    'Drive your hips up and squeeze your glutes.',
    'Lower slowly.',
  ),
  'step-up': h(
    'A bench or sturdy box, a dumbbell in each hand.',
    'Put your whole foot on the box.',
    'Drive through that heel to stand up on it.',
    'Step down with control. Switch legs.',
  ),
  'cable-kickback': h(
    'Cable station with the pulley at the bottom and an ankle strap.',
    'Strap one ankle and hold the frame.',
    'Kick that leg straight back.',
    'Return slowly. Switch legs.',
  ),
  abduction: h(
    'Hip abduction machine. Pads on the outside of your knees.',
    'Sit back, holding the handles.',
    'Push your knees apart.',
    'Return slowly.',
  ),
  'glute-bridge': h(
    'Floor or mat, lying on your back.',
    'Knees bent, feet flat near your glutes.',
    'Drive your hips up.',
    'Squeeze at the top, then lower.',
  ),
  'single-leg-bridge': h(
    'Floor or mat, lying on your back.',
    'One foot flat, the other leg straight.',
    'Drive up through the planted heel.',
    'Lower slowly. Switch legs.',
  ),

  // calves
  'standing-calf-raise': h(
    'Standing calf raise machine. Shoulders under the pads, balls of the feet on the edge.',
    'Let your heels drop below the step.',
    'Rise as high as you can onto your toes.',
    'Lower slowly.',
  ),
  'seated-calf-raise': h(
    'Seated calf raise machine. Pad on your lower thighs, balls of the feet on the edge.',
    'Release the safety lever.',
    'Push up onto your toes.',
    'Lower your heels slowly.',
  ),
  'donkey-calf-raise': h(
    'Donkey calf raise machine, or bend forward holding a support.',
    'Balls of the feet on the edge.',
    'Rise onto your toes.',
    'Lower slowly.',
  ),
  'db-calf-raise': h(
    'A dumbbell in each hand, balls of your feet on a step.',
    'Let your heels drop.',
    'Rise onto your toes.',
    'Lower slowly.',
  ),
  'single-leg-calf-raise': h(
    'A step, holding a wall or rail for balance.',
    'Stand on one foot.',
    'Rise onto your toes.',
    'Lower slowly. Switch feet.',
  ),
  'jump-rope-calves': h(
    'Jump rope and some space.',
    'Stay on the balls of your feet.',
    'Small, quick jumps, turning the rope with your wrists.',
    'Keep going for the time.',
  ),
  'tibialis-raise': h(
    'Lean your back against a wall, feet a step out in front.',
    'Heels on the floor.',
    'Lift your toes as high as you can.',
    'Lower slowly.',
  ),

  // cardio
  intervals: h(
    'Exercise bike.',
    'Warm up for a few minutes.',
    'Pedal as hard as you can for 30 seconds.',
    'Pedal easy for 90 seconds, then repeat.',
  ),
  'incline-walk': h(
    'Treadmill set to a 10–12% incline.',
    'Walk at a brisk pace you could hold a conversation at.',
    'Don’t hold onto the rails.',
    'Keep going for the time.',
  ),
  'row-erg': h(
    'Rowing machine. Strap your feet in.',
    'Push with your legs first.',
    'Then lean back slightly and pull the handle to your ribs.',
    'Return in reverse: arms, body, legs.',
  ),
  'stair-master': h(
    'Stair climber machine.',
    'Stand tall without leaning on the rails.',
    'Step at a steady pace.',
    'Keep going for the time.',
  ),
  'sled-push': h(
    'Loaded sled on turf.',
    'Hands on the poles, body leaning forward.',
    'Drive with short, powerful steps.',
    'Push for the distance.',
  ),
  'jump-rope': h(
    'Jump rope and some space.',
    'Small jumps on the balls of your feet.',
    'Turn the rope with your wrists, not your arms.',
    'Keep going for the time.',
  ),
  burpees: h(
    'Floor only.',
    'Squat and put your hands on the floor.',
    'Jump your feet back to a push-up position.',
    'Jump your feet in and jump up.',
  ),
  'mountain-climbers': h(
    'Floor only, in a push-up position.',
    'Drive one knee towards your chest.',
    'Switch legs quickly.',
    'Keep your hips low.',
  ),
  'high-knees': h(
    'Floor only.',
    'Run on the spot.',
    'Drive your knees up to hip height.',
    'Pump your arms.',
  ),
};

/** A YouTube search for form tutorials. Search, not a fixed video, so it never goes stale. */
export const videoUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;
