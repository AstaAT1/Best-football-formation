# Best Football Formation

Best Football Formation is a **football quiz + draft game** built with **React + Vite**.

The game combines:

- football trivia
- timed rounds
- player drafting
- squad management
- cards and penalties
- final lineup comparison

During each round, both sides answer a football question under time pressure.  
The side that answers correctly — or faster when both are correct — gets the first choice between 2 players from the same position.

At the end of the match, both teams are compared through a full **4-3-3 formation**, with hidden player overalls revealed only in the final sequence.

---

## Table of Contents

- [Overview](#overview)
- [Game Rules](#game-rules)
- [Round Order](#round-order)
- [Draft Phase](#draft-phase)
- [Changement Phase](#changement-phase)
- [Cards and Penalties](#cards-and-penalties)
- [Streak Bonus](#streak-bonus)
- [Final Score](#final-score)
- [End Sequence](#end-sequence)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Important Files](#important-files)
- [Installation](#installation)
- [Available Scripts](#available-scripts)
- [UI / Styling Notes](#ui--styling-notes)
- [Development Rules](#development-rules)
- [Acceptance Checklist](#acceptance-checklist)
- [Current Focus](#current-focus)
- [License](#license)

---

## Overview

**Best Football Formation** is a competitive football game where the player and the AI build teams by answering football trivia questions.

Each round includes:

- 1 football question
- 4 choices
- 2 players from the same position
- a 12-second countdown

The game is designed around a fixed football structure and ends with:

- red card removals
- player-by-player final reveal
- formation comparison
- final score calculation

A core design idea of the game is that **player ratings stay hidden until the end**.

---

## Game Rules

### General Rule

Every round presents:

- one multiple-choice football question
- two players from the same position

The result of the round is determined like this:

- one side correct, the other wrong or no answer → correct side wins
- both correct → fastest side wins
- both wrong or both no answer → question swaps
- maximum swaps per round: **3**

---

## Round Order

The game always has **15 rounds**, in this fixed order:

1. GK  
2. DF  
3. DF  
4. DF  
5. DF  
6. MF  
7. MF  
8. MF  
9. ATK  
10. ATK  
11. ATK  
12. GK *(changement round)*  
13. DF *(changement round)*  
14. MF *(changement round)*  
15. ATK *(changement round)*  

---

## Draft Phase

Rounds **1 to 11** are the normal draft phase.

These rounds build the final 4-3-3 team:

- 1 Goalkeeper
- 4 Defenders
- 3 Midfielders
- 3 Attackers

If the player wins a round, they choose first.  
If the bot wins, the bot chooses first.

---

## Changement Phase

Rounds **12 to 15** are **changement** rounds.

These rounds do not simply add new players.  
Instead, the selected player becomes a **candidate**.

Each side can then:

- replace an existing player in the same position
- or skip the changement

The AI decision depends on the chosen difficulty.

---

## Cards and Penalties

### Yellow Cards

A yellow card is given when:

- one side answers wrong
- while the opponent answers correctly

### Red Cards

Every:

```txt
3 yellow cards = 1 red card