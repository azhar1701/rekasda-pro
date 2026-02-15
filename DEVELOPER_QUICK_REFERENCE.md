# 🚀 Developer Quick Reference - UI/UX Design System

## 💻 Copy-Paste Imports

```tsx
import {
  // Cards (8 components)
  Card, CardHeader, CardTitle, CardContent, CardFooter, CardData, CardGrid, SectionCard,
  // Layout (6 components)
  AppLayout, PageHeader, PageContent, Section, ContentGrid,
  // Navigation (3 components)
  Sidebar, NavBadge, SidebarSection,
  // Existing
  Button, Input, EmptyState,
} from './ui';
```

---

## 🎨 Most Common Patterns

### Page Layout
```tsx
<> 
  <PageHeader title="Title" icon={<Icon />} />
  <PageContent>
    <Section title="Section">
      <ContentGrid columns={3}>
        {/* Cards */}
      </ContentGrid>
    </Section>
  </PageContent>
</>
```

### Metrics Display
```tsx
<CardGrid columns={3}>
  <CardData label="Q" value={245.8} unit="m³/s" highlight />
  <CardData label="V" value={1.2} unit="m/s" />
</CardGrid>
```

### Form in Card
```tsx
<Card>
  <CardHeader divider><CardTitle>Form</CardTitle></CardHeader>
  <CardContent><Input /></CardContent>
  <CardFooter><Button>Submit</Button></CardFooter>
</Card>
```

---

## 🎨 Color Cheat Sheet

✅ **Use**: `text-slate-900` (headings), `text-slate-600` (body), `text-slate-500` (secondary)  
❌ **Avoid**: gray colors, pure black, slate-400

---

## 📐 Spacing Defaults

- **Cards**: `p-6` or `p-8`
- **Grids**: `gap-6`
- **Sections**: `mb-8`

---

## ⚡ Quick Fixes

| Problem | Solution |
|---------|----------|
| Text hard to read | Use `text-slate-600` |
| Spacing cramped | Add `p-6`, `gap-6`, `mb-8` |
| Contrast fails | Use `text-slate-900` headings |
| Mobile broken | Use `ContentGrid columns={2}` |
| Colors wrong | Check hex values in guide |

---

## 📋 Accessibility Quick Check

- [ ] Headings: `text-slate-900`
- [ ] Body: `text-slate-600`
- [ ] Focus rings: `ring-2 ring-primary-500`
- [ ] Labels on inputs
- [ ] Color contrast ✓
- [ ] Keyboard nav ✓

---

**For full reference, open `UI_UX_REFACTORING_GUIDE.md`**
