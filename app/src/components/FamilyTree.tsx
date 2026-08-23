import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { buildFamilyTree, type MemberRelation } from '../lib/familyTree';

interface Profile {
    display_name: string;
    photo_url: string | null;
}

interface FamilyTreeProps {
    memberRelations: MemberRelation[];
    profiles: Map<string, Profile>;
    onEditPerson: (userId: string) => void;
}

interface LineSeg {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

// A rough family tree, prototyped and implemented per issue #11. Renders
// generations top-to-bottom (oldest first), couples paired side by side,
// inside a single shared horizontal scroll surface — the whole tree scrolls
// as one 2D canvas rather than each generation independently, so the
// connector lines (drawn in the same coordinate space as the content) never
// need to track an independent scroll offset. This is deliberately simpler
// than a full org-chart layout engine: it's readable at a glance for a
// small family without needing any explanation, which is the bar this
// audience (a grandparent and a teenager, no instruction) needs to clear.
export function FamilyTree({ memberRelations, profiles, onEditPerson }: FamilyTreeProps) {
    const generations = useMemo(() => buildFamilyTree(memberRelations), [memberRelations]);

    // Every person's canonical unit key — a couple unit is stored once,
    // keyed by its `personId`, but parent_id can point at either member of
    // that couple, so both ids need to resolve to the same DOM node.
    const personToUnitKey = useMemo(() => {
        const map = new Map<string, string>();
        for (const gen of generations) {
            for (const unit of gen) {
                map.set(unit.personId, unit.personId);
                if (unit.partnerId) map.set(unit.partnerId, unit.personId);
            }
        }
        return map;
    }, [generations]);

    const relationById = useMemo(() => new Map(memberRelations.map(m => [m.user_id, m])), [memberRelations]);

    const containerRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [lines, setLines] = useState<LineSeg[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [overflowing, setOverflowing] = useState(false);

    useLayoutEffect(() => {
        const recompute = () => {
            const container = containerRef.current;
            if (!container) return;

            setOverflowing(container.scrollWidth > container.clientWidth + 1);
            setCanvasSize({ width: container.scrollWidth, height: container.scrollHeight });

            const containerRect = container.getBoundingClientRect();
            const segments: LineSeg[] = [];
            const drawn = new Set<string>();

            // Each unit's DOM node is registered once, keyed by its
            // canonical (primary) personId — but a couple's two members can
            // each have their own, different parent_id (one married in, one
            // is a blood descendant), so both need checking, not just the
            // primary. Dedupe by parent-unit/child-unit pair in case both
            // partners resolve to the same parent unit.
            for (const gen of generations) {
                for (const unit of gen) {
                    const node = nodeRefs.current.get(unit.personId);
                    if (!node) continue;

                    for (const memberId of [unit.personId, unit.partnerId].filter((id): id is string => !!id)) {
                        const parentId = relationById.get(memberId)?.parent_id;
                        if (!parentId) continue;
                        const parentUnitKey = personToUnitKey.get(parentId);
                        if (!parentUnitKey || parentUnitKey === unit.personId) continue;
                        const parentNode = nodeRefs.current.get(parentUnitKey);
                        if (!parentNode) continue;

                        const dedupeKey = `${parentUnitKey}->${unit.personId}`;
                        if (drawn.has(dedupeKey)) continue;
                        drawn.add(dedupeKey);

                        const childRect = node.getBoundingClientRect();
                        const parentRect = parentNode.getBoundingClientRect();

                        segments.push({
                            x1: parentRect.left + parentRect.width / 2 - containerRect.left + container.scrollLeft,
                            y1: parentRect.bottom - containerRect.top + container.scrollTop,
                            x2: childRect.left + childRect.width / 2 - containerRect.left + container.scrollLeft,
                            y2: childRect.top - containerRect.top + container.scrollTop,
                        });
                    }
                }
            }
            setLines(segments);
        };

        recompute();
        window.addEventListener('resize', recompute);
        return () => window.removeEventListener('resize', recompute);
    }, [generations, profiles, personToUnitKey, relationById]);

    if (!generations.length) return null;

    return (
        <div>
            <div ref={containerRef} className="overflow-x-auto">
                <div className="relative inline-flex flex-col gap-10 p-4 min-w-full items-center">
                    <svg
                        className="absolute inset-0 pointer-events-none"
                        width={canvasSize.width}
                        height={canvasSize.height}
                    >
                        {lines.map((line, i) => (
                            <line
                                key={i}
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="var(--color-border)"
                                strokeWidth={2}
                            />
                        ))}
                    </svg>

                    {generations.map((gen, i) => (
                        <div key={i} className="flex gap-6 shrink-0">
                            {gen.map(unit => (
                                <UnitCard
                                    key={unit.personId}
                                    unit={unit}
                                    profiles={profiles}
                                    onEditPerson={onEditPerson}
                                    registerNode={(node) => {
                                        if (node) nodeRefs.current.set(unit.personId, node);
                                        else nodeRefs.current.delete(unit.personId);
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            {overflowing && (
                <p className="cx-label text-[10px] text-[var(--color-text-muted)] text-center mt-2">
                    ← Scroll to see the full tree →
                </p>
            )}
        </div>
    );
}

function UnitCard({
    unit,
    profiles,
    onEditPerson,
    registerNode,
}: {
    unit: { personId: string; partnerId: string | null };
    profiles: Map<string, Profile>;
    onEditPerson: (userId: string) => void;
    registerNode: (node: HTMLDivElement | null) => void;
}) {
    return (
        <div ref={registerNode} className="flex items-start gap-2">
            <PersonCard personId={unit.personId} profile={profiles.get(unit.personId)} onEdit={() => onEditPerson(unit.personId)} />
            {unit.partnerId && (
                <>
                    <div className="w-3 h-px bg-[var(--color-border)] mt-6" aria-hidden="true" />
                    <PersonCard personId={unit.partnerId} profile={profiles.get(unit.partnerId)} onEdit={() => onEditPerson(unit.partnerId!)} />
                </>
            )}
        </div>
    );
}

function PersonCard({ profile, onEdit }: { personId: string; profile: Profile | undefined; onEdit: () => void }) {
    const name = profile?.display_name || 'Unknown';
    return (
        <button
            onClick={onEdit}
            aria-label={`Edit ${name}'s family relationships`}
            className="flex flex-col items-center gap-1.5 w-20 py-1 min-h-11 group"
        >
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-secondary)] border-2 border-brand-teal overflow-hidden flex items-center justify-center">
                    {profile?.photo_url ? (
                        <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[var(--color-text-primary)] text-sm font-bold">{name.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-brand-teal group-hover:border-brand-teal transition-colors">
                    <Pencil size={10} />
                </span>
            </div>
            <span className="text-xs text-[var(--color-text-primary)] text-center truncate w-full">{name}</span>
        </button>
    );
}
