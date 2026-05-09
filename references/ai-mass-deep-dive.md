# Mass AI Deep-Dive — LelitDistrikt2

> Detailed reference for the Mass Entity framework powering crowd and traffic in this project.

---

## Architecture Overview

Mass is an **Entity Component System (ECS)**. It is fundamentally different from actor-based UE5 code:

| Traditional UE5 | Mass ECS |
|-----------------|----------|
| `AActor` with components | Lightweight entity (just an ID) |
| Virtual function calls | Data-oriented processor batches |
| Per-actor Tick | Processor queries + bulk updates |
| Hundreds of actors | Tens of thousands of entities |

The key insight: **data is separated from behavior**. Entities hold data (Fragments). Processors hold behavior and query entities by their Fragment composition.

---

## Core Concepts

### Entity
An entity is just an ID (`FMassEntityHandle`). It has no code — only data attached via Fragments.

```cpp
FMassEntityHandle Entity; // just wraps an index + serial number
```

### Fragment
A struct of data attached to an entity. No functions, no inheritance — pure data.

```cpp
USTRUCT()
struct FMyCrowdFragment : public FMassFragment
{
    GENERATED_BODY()
    float WalkSpeed = 150.0f;
    FVector Destination;
};
```

### Tag
A fragment with no data — used as a marker to filter entities.

```cpp
USTRUCT()
struct FMassOnLOD0Tag : public FMassTag
{
    GENERATED_BODY()
};
```

### Processor
Queries entities with specific fragments and runs logic on them each tick.

```cpp
UCLASS()
class UMyCrowdProcessor : public UMassProcessor
{
    GENERATED_BODY()
public:
    UMyCrowdProcessor();
    virtual void Execute(FMassEntityManager& EntityManager,
                         FMassExecutionContext& Context) override;
};
```

### Trait
A reusable bundle of Fragments + Processors packaged into a Blueprint-assignable asset.

### Mass Entity Config
A data asset (`UMassEntityConfigAsset`) that defines which Traits an agent type uses. Found in `Content/AI/`.

---

## How Crowd Works in This Project

```
Spawner (BP_CitySample_CrowdSpawner)
    ↓ spawns
Entity with Fragments:
    FMassTransformFragment       ← world position/rotation
    FMassCrowdFragment           ← crowd-specific state
    FMassVelocityFragment        ← movement velocity
    FMassLODFragment             ← current LOD level
    FMassRepresentationFragment  ← which mesh/ISM to show
    ↓ processed by
Processors each tick:
    UCitySampleCrowdVisualizationProcessor  ← updates ISM transforms
    UMassCrowdMovementProcessor             ← steers agents
    UMassLODProcessor                       ← switches LOD levels
```

### LOD levels for crowd agents
| LOD | Behavior |
|-----|----------|
| 0 | Full simulation + skeletal mesh animation |
| 1 | Simplified movement, vertex anim or ISM |
| 2 | Position update only, static pose |
| Off | Frozen or despawned |

---

## How Traffic Works

Traffic entities run similarly but use `MassTraffic` processors:

- `UMassTrafficVehicleSimulationProcessor` — vehicle physics
- `UMassTrafficMovementProcessor` — lane following
- `UMassTrafficIntersectionProcessor` — signal/intersection logic

Traffic config assets live in `Plugins/Traffic/`.

---

## Writing a Custom Processor

```cpp
// MyCrowdProcessor.h
#pragma once
#include "MassProcessor.h"
#include "MyCrowdProcessor.generated.h"

UCLASS()
class CITYSAMPLE_API UMyCrowdProcessor : public UMassProcessor
{
    GENERATED_BODY()
public:
    UMyCrowdProcessor();

protected:
    virtual void ConfigureQueries() override;
    virtual void Execute(FMassEntityManager& EntityManager,
                         FMassExecutionContext& Context) override;
private:
    FMassEntityQuery EntityQuery;
};
```

```cpp
// MyCrowdProcessor.cpp
#include "MyCrowdProcessor.h"
#include "MassCommonFragments.h"
#include "MassMovementFragments.h"

UMyCrowdProcessor::UMyCrowdProcessor()
{
    // run after movement, before visualization
    ExecutionOrder.ExecuteAfter.Add(UE::Mass::ProcessorGroupNames::Movement);
    ExecutionOrder.ExecuteBefore.Add(UE::Mass::ProcessorGroupNames::Representation);
}

void UMyCrowdProcessor::ConfigureQueries()
{
    // require these fragments
    EntityQuery.AddRequirement<FMassTransformFragment>(EMassFragmentAccess::ReadOnly);
    EntityQuery.AddRequirement<FMassCrowdFragment>(EMassFragmentAccess::ReadWrite);

    // only process LOD 0 agents (has this tag)
    EntityQuery.AddTagRequirement<FMassOnLOD0Tag>(EMassTagPresence::All);

    EntityQuery.RegisterWithProcessor(*this);
}

void UMyCrowdProcessor::Execute(FMassEntityManager& EntityManager,
                                FMassExecutionContext& Context)
{
    EntityQuery.ForEachEntityChunk(EntityManager, Context,
        [](FMassExecutionContext& Context)
        {
            TArrayView<FMassCrowdFragment> CrowdFragments =
                Context.GetMutableFragmentView<FMassCrowdFragment>();
            TConstArrayView<FMassTransformFragment> Transforms =
                Context.GetFragmentView<FMassTransformFragment>();

            for (int32 i = 0; i < Context.GetNumEntities(); ++i)
            {
                // process each entity
                CrowdFragments[i].WalkSpeed = 150.0f;
            }
        });
}
```

---

## Writing a Custom Fragment

```cpp
USTRUCT()
struct CITYSAMPLE_API FMyCrowdStateFragment : public FMassFragment
{
    GENERATED_BODY()

    UPROPERTY()
    float Urgency = 0.0f;

    UPROPERTY()
    bool bIsFleeing = false;
};
```

Register it in a Trait so entities get it at spawn:

```cpp
UCLASS()
class UMyCrowdTrait : public UMassEntityTraitBase
{
    GENERATED_BODY()
    virtual void BuildTemplate(FMassEntityTemplateBuildContext& BuildContext,
                               const UWorld& World) const override
    {
        BuildContext.AddFragment<FMyCrowdStateFragment>();
    }
};
```

---

## Querying Entities from Outside a Processor

Sometimes you need to read/write entity data from an Actor or subsystem:

```cpp
UMassEntitySubsystem* EntitySubsystem =
    GetWorld()->GetSubsystem<UMassEntitySubsystem>();
FMassEntityManager& Manager = EntitySubsystem->GetMutableEntityManager();

// Check if entity is valid
if (Manager.IsEntityValid(Entity))
{
    // Read a fragment
    const FMassTransformFragment& Transform =
        Manager.GetFragmentDataChecked<FMassTransformFragment>(Entity);

    // Write a fragment
    FMyCrowdStateFragment& State =
        Manager.GetFragmentDataChecked<FMyCrowdStateFragment>(Entity);
    State.bIsFleeing = true;

    // Add a tag
    Manager.AddTagToEntity(Entity, FMyFleeingTag::StaticStruct());

    // Remove a tag
    Manager.RemoveTagFromEntity(Entity, FMyFleeingTag::StaticStruct());
}
```

---

## Signals (Event System for Mass)

Mass uses Signals to communicate events between processors without tight coupling:

```cpp
// Send a signal to an entity
UMassSignalSubsystem* SignalSubsystem =
    GetWorld()->GetSubsystem<UMassSignalSubsystem>();
SignalSubsystem->SignalEntity(UE::CitySample::Signals::OnCrowdReachedDestination, Entity);

// Receive in a processor — inherit from UMassSignalProcessorBase
```

---

## Debugging Mass

### Console commands
```
mass.debug.DrawDebugEntities 1        — draw all entities as points
mass.LOD.DebugDraw 1                  — color entities by LOD level
mass.debug.ShowEntityCount 1          — show entity count on screen
mass.processor.SortEnabled 0          — disable processor sorting (testing)
```

### Mass Debugger panel
Window → Mass Entity Debugger
- Inspect live fragment values on selected entities
- See processor execution order
- Watch entity composition changes

### Logging
```cpp
UE_LOG(LogMass, Log, TEXT("Entity %s reached destination"),
    *Entity.DebugGetDescription());
```

### Common issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Agents frozen in place | Processor not registered / query misconfigured | Check `ConfigureQueries`, verify fragment requirements |
| Crash in processor | Accessing fragment not in query | Add it to `EntityQuery.AddRequirement` |
| Agents not spawning | Entity Config missing a required Trait | Check `Content/AI/` config asset |
| Visualization missing | LOD too low — representation disabled | Lower `mass.LOD.ViewerDistanceScale` |

---

## Crowd Folders in This Project

| Path | Contents |
|------|----------|
| `Source/CitySample/Crowd/` | C++ processors and fragments |
| `Plugins/CitySampleMassCrowd/Source/` | Plugin-level crowd processors |
| `Content/AI/` | Entity config assets, spawner Blueprints |
| `Content/Crowd/` | Character meshes, clothing, animation sets |
| `Content/Vehicle/` | Traffic vehicle meshes, configs |

---

## Execution Order Groups (built-in)

```
PrePhysics
StartPhysics
DuringPhysics
EndPhysics
PostPhysics

Avoidance        ← crowd steering
Movement         ← position updates
Representation   ← ISM/mesh updates (last)
```

---

## Future Scope — Hybrid NPC Architecture for Cinematics

**Context:** Mass crowd entities are spawned at runtime and despawn when play stops. This is by design and should not be changed. However, for cinematic sequences and scripted scenarios, a parallel system of manually placed "hero" NPCs is planned.

### The approach

- Mass crowd continues to handle background population density (unchanged).
- Key NPCs required for specific scenes are placed as **standard Blueprint Actor instances** directly in the level — not spawned by Mass.
- Each instance references a shared parent Blueprint class with two exposed variables: an **animation asset** and an optional **audio asset**. This avoids creating a unique Blueprint per character.
- The skeletal mesh used is the same mesh already used by Mass crowd characters (already optimized, no Metahuman overhead needed for these roles).

### Why not Metahuman Blueprints per character

Metahuman Blueprints are large and expensive. For NPCs engaged in a fixed activity (sitting, talking, standing at a stall) close-but-not-hero proximity to camera, the Mass crowd mesh in a lightweight Actor BP is sufficient and far cheaper.

### Sequencer integration

These placed NPCs are fully controllable via Sequencer:
- Animation can be keyframed or swapped per shot
- Audio components can be triggered on timeline cues
- Visibility, position, and blend weights are all animatable
- This makes them suitable for pre-authored cinematic sequences where precise NPC placement and timing is required

### Lip sync decision (defer but don't ignore)

If any hero NPC needs to speak with lip sync in a cinematic, the approach must be decided before production begins — retrofitting is costly. Options: MetaSounds + Control Rig visemes (full), or a looping "talking" animation (acceptable for background/mid-distance NPCs). This decision can be deferred until the first cinematic sequence is scoped.

### Status

Not yet implemented. This note exists to preserve the architectural decision so it is not lost when cinematic work begins.

Use `ExecutionOrder.ExecuteAfter` and `ExecuteBefore` in your processor constructor to slot in correctly.
