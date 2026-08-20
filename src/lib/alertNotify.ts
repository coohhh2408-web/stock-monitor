/** 边沿触发：只在「未触发 → 已触发」时响一次，区内反复刷新不再报。 */
export function reconcileAlertNotifications(
  previouslyNotified: ReadonlySet<string>,
  triggeredIds: readonly string[],
): { notified: Set<string>; fireIds: string[] } {
  const triggered = new Set(triggeredIds)
  const notified = new Set<string>()
  const fireIds: string[] = []

  for (const id of triggered) {
    notified.add(id)
    if (!previouslyNotified.has(id)) fireIds.push(id)
  }

  return { notified, fireIds }
}

export function sameAlertIdSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false
  for (const id of a) {
    if (!b.has(id)) return false
  }
  return true
}
