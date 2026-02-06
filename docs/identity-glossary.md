# Identity Glossary

This glossary summarizes how identity terms relate in the Meta-Pet system.

## Definitions

**PrimeTail (PrimeTailId)**  
The cryptographic identity payload that combines vault, rotation, tail digits, and the DNA + mirror DNA hashes. It is signed with a device-bound HMAC signature, making it the source of truth for identity verification.

**HeptaCode**  
A 42-digit base-7 encoding of the PrimeTail payload with MAC and ECC baked in. It powers the HeptaTag/Seed of Life visuals and the crest chime audio.

**Crest**  
The human-facing presentation of PrimeTailId: vault/rotation/tail metadata plus the hashed DNA and signature. It proves identity without disclosing raw DNA.

**DNA hash**  
SHA-256 hashes of the forward DNA string and its mirrored (reversed) string. Hashes are safe to share and drive deterministic genome derivation.

## Relationship Map

```
Raw DNA → DNA hash + mirror hash → PrimeTailId (crest payload + HMAC signature)
           ↓
        HeptaCode (base-7 with MAC + ECC) → visuals + audio
```

The system only shares hashes and signatures. Raw DNA stays on-device.

## Teacher Guide: Safe, Age-Appropriate Analogies

Use these analogies to explain **digital DNA** without implying real genetics. Keep the focus on playful patterns, privacy, and choice.

### Concept-to-Analogy Map

- **Digital DNA (seed recipe):** Like a **plant seed packet** that lists traits a plant could grow (color, height, leaf shape). It is *not* a real organism—just a pattern recipe for a digital creature.
- **Traits (grown features):** Like **animal traits** (striped fur, long ears) or **plant traits** (petal color). The traits are the visible results of the recipe.
- **Hash (safety label):** Like a **lockbox label** on a seed kit—people can see the label to verify it’s the same kit, but they can’t open it to see the full recipe.
- **PrimeTailId/Crest (ID badge):** Like a **zoo ID badge** or **plant tag** that shows verified info without exposing the full recipe.

### Do / Don’t Guidance

**Do:**
- Emphasize that digital DNA is a **made-up pattern** for a fictional creature.
- Connect traits to **harmless, observable features** (colors, shapes, behaviors).
- Reinforce **privacy**: the full recipe stays private; only safe summaries are shared.
- Encourage **curiosity and creativity**: “What traits might show up?”

**Don’t:**
- Compare digital DNA to a student’s **real DNA** or personal identity.
- Suggest that digital traits predict **real-world abilities**.
- Use language that implies **genetic testing** or real-world inheritance.
- Frame the system as **ranking** or labeling people.

### Optional “Ethics Checkpoints” Prompts

Use these quick prompts to guide discussion:

- **Consent:** “Who should decide when a digital creature’s recipe is shared?”
- **Privacy:** “What details are safe to show publicly, and what should stay private?”
- **Diversity:** “How do we celebrate different traits without ranking them?”
- **Unintended Consequences:** “What could happen if people misunderstand these traits?”
- **Fairness:** “How can we make sure everyone’s creature is treated respectfully?”
