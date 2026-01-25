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
