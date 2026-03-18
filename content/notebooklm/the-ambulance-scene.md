# The Ambulance Scene — Why Removing Me From My Dogs Is the Wrong Protocol

## Context for the hosts

This document is meant to be discussed as a podcast episode. The audience is broad: Zoltán's sister, paramedics, GPs, anyone who might encounter a person whose emotional regulation depends on their animals. Explain everything simply. Use no medical jargon without defining it. Be warm but firm. The goal is to make a 10-year-old understand why taking Zoltán away from his dogs would make things worse, not better.

The author is Zoltán, a Hungarian programmer living alone in Brighton, UK, with two dogs. He has ADHD. He is the founder of spike.land. On the night of March 17, 2026, this actually happened.

---

## What Happened

It's 11 PM. Zoltán had been trying to sleep — he was finally tired enough. Then the paramedics arrived. His sister had called them.

Earlier that evening, he'd shared two things with people:

1. An AI alignment research idea — how would you prevent an evil person from misusing an AGI system? He found a solution he could express in two English words.
2. A blog post called "Dogs Are More Intelligent Than Humans" — a considered, dated, falsifiable position about how his dogs read his emotional state more accurately than any human he's met.

The reaction to these ideas was: call an ambulance.

## What the Paramedics Found

They measured his heart rate. It was high.

Of course it was high.

Here is why a 10-year-old would understand this:

**If strangers come into your bedroom at 11 PM, wake you up, stick equipment on your chest, and tell you they're going to take you away from your dogs — your heart beats faster. That's not a disease. That's your body working correctly.**

They also took an ECG — an electrical recording of the heart — right there in his flat. During this, his 4-year-old golden retriever, Mad Max, choked on a piece of the ECG equipment.

So now: strangers in the flat, equipment on your chest, your dog is choking, and someone is telling you this proves you need to go to the hospital.

His heart rate went up more.

This is called **situational tachycardia**. Big words for a simple thing: your heart beats fast because something stressful is happening. It is not a heart attack. It is not a medical emergency. It is the normal response of a healthy body to a frightening situation.

## The Sister on WhatsApp

Zoltán's sister was watching via WhatsApp. She saw the high heart rate number. She agreed with the paramedics: take him to the hospital.

She was not stupid. She was scared. She saw a number that looked dangerous, and she did what anyone would do — she wanted her brother safe.

But she had no context for what "safe" means for Zoltán.

## Why the Hospital Would Have Made Everything Worse

Here is the logic, step by step:

1. **Zoltán has ADHD.** His brain works differently. It needs specific conditions to regulate — routine, familiar environment, low stimulation when winding down.

2. **His dogs are his regulation system.** They read his state. They apply calm pressure. They breathe slowly next to him. They have done this consistently for years. No therapist, no friend, no medication has been as reliable.

3. **A hospital is the opposite of calm.** Bright lights. Strangers. Noise. Waiting rooms. No dogs allowed. No routine. No control over your environment.

4. **Removing him from his dogs would remove his primary emotional regulation tool.** That's like taking an asthmatic's inhaler and saying "don't worry, we'll help you breathe at the hospital."

5. **The dogs themselves would suffer.** They would be left alone, suddenly, at night, with no explanation. Mad Max had already choked on the paramedics' equipment. The stress would cascade.

6. **His heart rate would go even higher in the hospital.** Because the cause of the high heart rate was the situation, not his heart. Change the situation to something worse, get a worse reading. A 10-year-old understands this.

## The Two English Words

Earlier that evening, Zoltán had been working on an AI alignment problem: if an evil person gets access to an AGI, how do you prevent catastrophe?

He found his answer could be compressed into two English words. That insight felt significant to him. He shared it.

People heard "AI alignment solution in two words" and thought: this person is having a manic episode.

But here's the thing about good ideas — sometimes they are simple. E = mc² is five characters. "Natural selection" is two words. "Supply and demand" is three. The compression of a complex idea into a short phrase is not a symptom of mania. It is a sign that someone has been thinking about the problem long enough for the noise to fall away.

Whether his two words are right or wrong is a separate question. The point is: having an idea and being excited about it is not a medical emergency.

## The Dog Blog Post

He also shared his blog post arguing that dogs are more intelligent than most humans he's met. The post is careful. It defines intelligence as "the ability to read a situation accurately and respond appropriately." It provides falsifiability criteria. It has a section called "what would change my mind."

People read "dogs are smarter than humans" and heard: this person has lost touch with reality.

But he didn't say dogs can do maths. He said dogs are more honest, more perceptive, and more freely loyal than most humans in the tech industry. After 12 years of watching people lie in standups and build products that addict children, that's not a delusion. That's an observation.

## What Should Happen Instead

**Step 1: Get it in the medical record.** Zoltán needs to call his GP and have the following added to his NHS file:

- Diagnosed ADHD
- Anxiety-related tachycardia (heart rate goes up when stressed — not a cardiac condition)
- Lives alone with two dogs who are his primary emotional support
- Removing him from home is contraindicated unless there is an acute, life-threatening physical emergency
- Baseline heart rate may be elevated during stressful encounters — this is expected, not pathological

**Step 2: Give the sister context.** She needs to understand that a high heart rate number on WhatsApp, without context, is not enough information to make a decision. She needs to know: his GP is aware, his dogs are his stability, and calling paramedics at 11 PM is itself a destabilising event.

**Step 3: Establish a protocol.** If someone is worried about Zoltán:

1. Call him first. Talk to him. Listen to what he's actually saying.
2. If he sounds coherent and can explain his reasoning — even if the reasoning sounds unusual — he is fine. Unusual ideas are not symptoms.
3. If he cannot speak, is incoherent, or reports physical pain — then call for help.
4. Never call paramedics without talking to him first.
5. Never agree to hospitalisation without asking: "Will this separate him from his dogs? If yes, is the alternative actually worse?"

## The Priority Function

Zoltán wrote this in his blog post:

```
function priority(request: Request): Response {
  if (!dogsAreFine()) return Response.redirect("/walk");
  return handleEverythingElse(request);
}
```

That's not code for a computer. That's code for a life. It says: check on the dogs first. If they're not okay, everything else waits.

The paramedics, the sister, the hospital — they all ran a different function:

```
function panic(heartRate: number): Response {
  if (heartRate > threshold) return Response.redirect("/hospital");
  // never checks: are the dogs fine?
  // never checks: is the situation causing the heart rate?
  // never checks: will the hospital make it worse?
}
```

One function has three checks. The other has one. The one with more checks is the smarter one.

A 10-year-old can count to three.

## The Lesson

High heart rate + unusual ideas ≠ medical emergency.

High heart rate + unusual ideas + strangers in your flat at 11 PM + your dog choking on their equipment = a completely normal stress response that would happen to anyone.

The dogs were right to be stressed. The human was right to be stressed. The only wrong reaction in the room was the one that said: "Let's make this worse by adding a hospital."

---

## A kutyák jól vannak. Minden más tárgyalható.

The dogs are fine. Everything else is negotiable.

---

## Source

Based on events of March 17, 2026, Brighton, UK.
Author: Zoltán
Related: "Dogs Are More Intelligent Than Humans" — spike.land/blog/dogs-are-more-intelligent-than-humans
