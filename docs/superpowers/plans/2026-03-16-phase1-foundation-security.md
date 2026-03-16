# Phase 1: Foundation & Security Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all security issues, replace mock data with real Firestore data, fix bugs, and establish a stable foundation for the collaboration features in Phase 2.

**Architecture:** React 19 SPA with Firebase (Auth, Firestore, Cloud Storage). Context providers for auth/family/trip state. Service layer for Firestore operations. Tailwind CSS v4 with `@theme` directive.

**Tech Stack:** React 19, TypeScript, Vite 7, Firebase 12, Tailwind CSS 4, Vitest, React Router 7, date-fns

---

## File Structure

### Files to CREATE:
| File | Responsibility |
|------|---------------|
| `app/src/components/ProtectedRoute.tsx` | Auth gate layout route, redirects unauthenticated users to /profile |
| `app/src/components/ErrorBoundary.tsx` | Top-level + per-route React error boundary |
| `app/src/hooks/useTrip.ts` | Hook to fetch/subscribe to a single trip by ID from URL params |
| `app/.gitignore.root` | Root-level gitignore (rename to `.gitignore` at project root) |

### Files to MODIFY:
| File | Changes |
|------|---------|
| `app/src/types/index.ts` | Add User type, fix Trip type (startDate/endDate, budget), add Expense/Task/TripEvent types |
| `app/firestore.rules` | Replace wide-open rules with family-scoped security |
| `app/storage.rules` | Replace wide-open rules with trip-scoped security |
| `app/src/App.tsx` | Add ProtectedRoute wrapper, remove Discover route, remove Meals route |
| `app/src/components/BottomNav.tsx` | Remove Discover tab, 4-tab nav |
| `app/src/layouts/TripLayout.tsx` | Use useTrip hook for URL-based trip loading, remove Meals tab |
| `app/src/pages/Home.tsx` | Wire to real Firestore data via contexts |
| `app/src/pages/Family.tsx` | Wire to real FamilyContext data, remove mock members |
| `app/src/pages/Profile.tsx` | Wire stats to real data |
| `app/src/pages/Trips.tsx` | Fix date handling (date pickers, calculated daysAway), fix budget |
| `app/src/pages/trip/TripBudget.tsx` | Use trip.budget instead of hardcoded $5000 |
| `app/src/services/firestore.ts` | Remove duplicate createTrip, consolidate with tripService |
| `app/src/services/tripService.ts` | Add proper TypeScript types, remove `any` |
| `app/src/contexts/TripContext.tsx` | Remove duplicate createTrip, use service layer |
| `app/src/contexts/AuthContext.tsx` | Add user profile sync to Firestore |
| `app/src/index.css` | Add light mode theme variables |

### Files to DELETE:
| File | Reason |
|------|--------|
| `app/src/pages/Discover.tsx` | Cut from beta (unanimous) |
| `app/src/pages/trip/TripMeals.tsx` | Cut from beta (unanimous) |

---

## Chunk 1: Security & Types Foundation

### Task 1: Fix Types — Trip Model with Real Dates and Budget

**Files:**
- Modify: `app/src/types/index.ts`

- [ ] **Step 1: Update the types file with proper interfaces**

Replace the entire contents of `app/src/types/index.ts`:

```typescript
export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    createdAt: number;
}

export interface Family {
    id: string;
    name: string;
    members: string[]; // User IDs
    admins: string[]; // User IDs
    createdAt: number;
}

export interface Trip {
    id: string;
    userId: string; // Creator
    familyId: string | null;
    title: string;
    startDate: string; // ISO date string YYYY-MM-DD
    endDate: string; // ISO date string YYYY-MM-DD
    image: string;
    budget: number; // Total budget in dollars
    createdAt: number;
}

export interface TripEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    location: string;
    description: string;
    createdBy?: string; // userId
}

export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    paidBy?: string; // userId
    createdAt?: any;
}

export interface Task {
    id: string;
    title: string;
    status: 'todo' | 'doing' | 'done';
    assignedTo?: string; // userId
    createdBy?: string; // userId
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/mike/Projects/VacaVerse/app && npx tsc --noEmit 2>&1 | head -30`

Expected: Type errors in files that reference old Trip shape (dates, daysAway, progress). This is expected — we'll fix them in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
cd /Users/mike/Projects/VacaVerse/app
git add src/types/index.ts
git commit -m "refactor: update type definitions with real dates, budget, and proper interfaces"
```

---

### Task 2: Firestore Security Rules

**Files:**
- Modify: `app/firestore.rules`

- [ ] **Step 1: Write proper security rules**

Replace `app/firestore.rules` with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User profiles: only the owner can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Families: members can read, admins can write
    match /families/{familyId} {
      allow read: if request.auth != null
        && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && request.auth.uid in resource.data.members;
    }

    // Trips: family members can read/write
    match /trips/{tripId} {
      function isTripOwner() {
        return request.auth.uid == resource.data.userId;
      }

      function isFamilyMemberOfTrip() {
        let trip = resource.data;
        return trip.familyId == null
          ? request.auth.uid == trip.userId
          : request.auth.uid in get(/databases/$(database)/documents/families/$(trip.familyId)).data.members;
      }

      function canCreateTrip() {
        let data = request.resource.data;
        return data.familyId == null
          ? true
          : request.auth.uid in get(/databases/$(database)/documents/families/$(data.familyId)).data.members;
      }

      allow read: if request.auth != null && isFamilyMemberOfTrip();
      allow create: if request.auth != null && canCreateTrip();
      allow update, delete: if request.auth != null && isFamilyMemberOfTrip();

      // Trip subcollections: same access as parent trip
      match /events/{eventId} {
        allow read, write: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/trips/$(tripId)).data.familyId == null
            ? request.auth.uid == get(/databases/$(database)/documents/trips/$(tripId)).data.userId
            : request.auth.uid in get(/databases/$(database)/documents/families/$(get(/databases/$(database)/documents/trips/$(tripId)).data.familyId)).data.members;
      }

      match /expenses/{expenseId} {
        allow read, write: if request.auth != null;
      }

      match /tasks/{taskId} {
        allow read, write: if request.auth != null;
      }

      match /documents/{docId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

Note: The subcollection rules are simplified for beta — they require authentication but use the trip-level family check pattern. The complex nested `get()` calls for subcollections can hit Firestore's 10-call limit, so for beta we keep subcollection rules simpler (require auth) and rely on the app layer for authorization. This is a known trade-off documented in the security section.

- [ ] **Step 2: Commit**

```bash
git add firestore.rules
git commit -m "security: replace wide-open Firestore rules with family-scoped access control"
```

---

### Task 3: Storage Security Rules

**Files:**
- Modify: `app/storage.rules`

- [ ] **Step 1: Write scoped storage rules**

Replace `app/storage.rules` with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Trip images and documents: authenticated users only
    match /trips/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add storage.rules
git commit -m "security: scope storage rules to authenticated trip owners"
```

---

### Task 4: Fix .gitignore and .env

**Files:**
- Modify: `app/.gitignore`
- Create: `.gitignore` (root level)

- [ ] **Step 1: Create root-level .gitignore**

Create `/.gitignore` (project root):

```
.DS_Store
.env
.env.local
.env.*.local
node_modules/
dist/
*.log
```

- [ ] **Step 2: Ensure app-level .gitignore includes .env**

Check `app/.gitignore` includes `.env`. If not, add it.

- [ ] **Step 3: Remove .env from git tracking (without deleting the file)**

```bash
cd /Users/mike/Projects/VacaVerse
git rm --cached app/.env 2>/dev/null || true
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore app/.gitignore
git commit -m "security: add root .gitignore, stop tracking .env file"
```

---

### Task 5: ProtectedRoute Component

**Files:**
- Create: `app/src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Create the ProtectedRoute component**

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/profile" replace />;
    }

    return <Outlet />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProtectedRoute.tsx
git commit -m "feat: add ProtectedRoute component for auth gating"
```

---

### Task 6: ErrorBoundary Component

**Files:**
- Create: `app/src/components/ErrorBoundary.tsx`

- [ ] **Step 1: Create the ErrorBoundary component**

```typescript
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle size={48} className="text-red-400 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                    <p className="text-gray-400 mb-4">An unexpected error occurred.</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-6 py-3 bg-brand-teal text-white rounded-lg font-medium"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ErrorBoundary.tsx
git commit -m "feat: add ErrorBoundary component for graceful error handling"
```

---

## Chunk 2: Route Cleanup & App Shell

### Task 7: Update App.tsx — Routes, ProtectedRoute, ErrorBoundary, Remove Discover/Meals

**Files:**
- Modify: `app/src/App.tsx`
- Delete: `app/src/pages/Discover.tsx`
- Delete: `app/src/pages/trip/TripMeals.tsx`

- [ ] **Step 1: Update App.tsx**

Replace `app/src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { TripProvider } from './contexts/TripContext';
import { ToastProvider } from './contexts/ToastContext';

import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import TripLayout from './layouts/TripLayout';
import Home from './pages/Home';
import Family from './pages/Family';
import Trips from './pages/Trips';
import TripTasks from './pages/trip/TripTasks';
import TripBudget from './pages/trip/TripBudget';
import TripItinerary from './pages/trip/TripItinerary';
import TripDocuments from './pages/trip/TripDocuments';
import Profile from './pages/Profile';

export default function App() {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AuthProvider>
                    <FamilyProvider>
                        <TripProvider>
                            <BrowserRouter>
                                <Routes>
                                    {/* Public route: Profile/Login */}
                                    <Route path="/profile" element={<MainLayout />}>
                                        <Route index element={<Profile />} />
                                    </Route>

                                    {/* Protected routes */}
                                    <Route element={<ProtectedRoute />}>
                                        <Route path="/" element={<MainLayout />}>
                                            <Route index element={<Home />} />
                                            <Route path="family" element={<Family />} />
                                            <Route path="trips" element={<Trips />} />
                                            <Route path="trips/:tripId" element={<TripLayout />}>
                                                <Route index element={<TripItinerary />} />
                                                <Route path="tasks" element={<TripTasks />} />
                                                <Route path="budget" element={<TripBudget />} />
                                                <Route path="documents" element={<TripDocuments />} />
                                            </Route>
                                        </Route>
                                    </Route>
                                </Routes>
                            </BrowserRouter>
                        </TripProvider>
                    </FamilyProvider>
                </AuthProvider>
            </ToastProvider>
        </ErrorBoundary>
    );
}
```

- [ ] **Step 2: Delete Discover.tsx and TripMeals.tsx**

```bash
rm src/pages/Discover.tsx src/pages/trip/TripMeals.tsx
```

- [ ] **Step 3: Update BottomNav — remove Discover tab**

Replace `app/src/components/BottomNav.tsx`:

```typescript
import { Home, Users, Briefcase, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Family', path: '/family' },
    { icon: Briefcase, label: 'Trips', path: '/trips' },
    { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-gray-800 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ icon: Icon, label, path }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            twMerge(
                                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                                isActive ? 'text-brand-teal' : 'text-gray-500 hover:text-gray-300'
                            )
                        }
                    >
                        <Icon size={24} />
                        <span className="text-xs font-medium">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
```

- [ ] **Step 4: Update TripLayout — remove Meals tab**

In `app/src/layouts/TripLayout.tsx`, change the tabs array from:
```typescript
const tabs = [
    { name: 'Itinerary', path: '' },
    { name: 'Budget', path: 'budget' },
    { name: 'Tasks', path: 'tasks' },
    { name: 'Meals', path: 'meals' },
    { name: 'Docs', path: 'documents' },
];
```
to:
```typescript
const tabs = [
    { name: 'Itinerary', path: '' },
    { name: 'Budget', path: 'budget' },
    { name: 'Tasks', path: 'tasks' },
    { name: 'Docs', path: 'documents' },
];
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: add route protection, error boundaries, remove Discover and Meals pages"
```

---

## Chunk 3: Fix Trip Data Model & Services

### Task 8: Consolidate Trip Services & Fix Data Model

**Files:**
- Modify: `app/src/services/firestore.ts`
- Modify: `app/src/services/tripService.ts`
- Modify: `app/src/contexts/TripContext.tsx`
- Modify: `app/src/pages/Trips.tsx`

- [ ] **Step 1: Update firestore.ts — remove createTrip, keep getTrips with updated type**

Replace `app/src/services/firestore.ts`:

```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Trip } from '../types';

export const TRIPS_COLLECTION = 'trips';

export const getTrips = async (userId: string): Promise<Trip[]> => {
    try {
        const q = query(
            collection(db, TRIPS_COLLECTION),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const trips = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Trip));
        return trips.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error getting trips:', error);
        throw error;
    }
};
```

- [ ] **Step 2: Update tripService.ts — add createTrip here, add proper types**

Replace `app/src/services/tripService.ts`:

```typescript
import {
    collection, doc, updateDoc, deleteDoc, addDoc,
    getDocs, serverTimestamp, query
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TRIPS_COLLECTION } from './firestore';
import type { Trip, TripEvent, Expense, Task } from '../types';

// -- Trip Core --

export const createTrip = async (
    userId: string,
    tripData: Omit<Trip, 'id' | 'userId' | 'createdAt' | 'familyId'>
): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, TRIPS_COLLECTION), {
            userId,
            familyId: null, // Will be set when family features are built
            ...tripData,
            createdAt: Date.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating trip:', error);
        throw error;
    }
};

export const updateTrip = async (tripId: string, data: Partial<Trip>) => {
    try {
        const tripRef = doc(db, TRIPS_COLLECTION, tripId);
        await updateDoc(tripRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating trip:', error);
        throw error;
    }
};

export const deleteTrip = async (tripId: string) => {
    try {
        await deleteDoc(doc(db, TRIPS_COLLECTION, tripId));
    } catch (error) {
        console.error('Error deleting trip:', error);
        throw error;
    }
};

// -- Sub-Collections --

export const addSubCollectionItem = async <T extends Record<string, unknown>>(
    tripId: string,
    collectionName: string,
    data: T
): Promise<string> => {
    try {
        const subColRef = collection(db, TRIPS_COLLECTION, tripId, collectionName);
        const docRef = await addDoc(subColRef, {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error(`Error adding to ${collectionName}:`, error);
        throw error;
    }
};

export const updateSubCollectionItem = async <T extends Record<string, unknown>>(
    tripId: string,
    collectionName: string,
    itemId: string,
    data: T
) => {
    try {
        const itemRef = doc(db, TRIPS_COLLECTION, tripId, collectionName, itemId);
        await updateDoc(itemRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error(`Error updating in ${collectionName}:`, error);
        throw error;
    }
};

export const deleteSubCollectionItem = async (
    tripId: string,
    collectionName: string,
    itemId: string
) => {
    try {
        const itemRef = doc(db, TRIPS_COLLECTION, tripId, collectionName, itemId);
        await deleteDoc(itemRef);
    } catch (error) {
        console.error(`Error deleting from ${collectionName}:`, error);
        throw error;
    }
};

export const getSubCollection = async <T>(
    tripId: string,
    collectionName: string
): Promise<(T & { id: string })[]> => {
    try {
        const subColRef = collection(db, TRIPS_COLLECTION, tripId, collectionName);
        const q = query(subColRef);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (T & { id: string })[];
    } catch (error) {
        console.error(`Error getting ${collectionName}:`, error);
        throw error;
    }
};
```

- [ ] **Step 3: Simplify TripContext — remove duplicate createTrip**

Replace `app/src/contexts/TripContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import type { Trip } from '../types';

interface TripContextType {
    trips: Trip[];
    loading: boolean;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { currentFamily } = useFamily();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setTrips([]);
            setLoading(false);
            return;
        }

        let q;
        if (currentFamily) {
            q = query(
                collection(db, 'trips'),
                where('familyId', '==', currentFamily.id)
            );
        } else {
            q = query(
                collection(db, 'trips'),
                where('userId', '==', user.uid)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tripData: Trip[] = [];
            snapshot.forEach((doc) => {
                tripData.push({ id: doc.id, ...doc.data() } as Trip);
            });
            setTrips(tripData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, currentFamily]);

    return (
        <TripContext.Provider value={{ trips, loading }}>
            {children}
        </TripContext.Provider>
    );
};

export const useTrip = () => {
    const context = useContext(TripContext);
    if (context === undefined) {
        throw new Error('useTrip must be used within a TripProvider');
    }
    return context;
};
```

- [ ] **Step 4: Update Trips.tsx — date pickers, calculated countdown, real budget**

This is the largest change. Update `app/src/pages/Trips.tsx` to:
1. Replace freeform date text input with two date inputs (start date, end date)
2. Calculate `daysAway` from `startDate` using `differenceInDays` from date-fns
3. Add budget input to trip creation form
4. Remove `progress` object from trip creation (it was based on old type)
5. Update `TripListCard` to use new Trip type fields
6. Import `createTrip` from `services/tripService` instead of `services/firestore`
7. Display date range as `format(startDate) - format(endDate)` using date-fns

Key changes in the creation form:
- Replace single `dates` text field with `startDate` and `endDate` date pickers
- Add `budget` number input with label "Trip Budget ($)"
- Remove `daysAway: Math.random()` and calculate from startDate
- Remove `progress` object entirely

Key changes in TripListCard:
- Show `formatDistance(new Date(trip.startDate), new Date())` for days away
- Show budget as `$${trip.budget.toLocaleString()}` instead of progress percentages
- Remove the 3-column progress grid (budget%, tasks%, bookings) since we no longer have those fields

- [ ] **Step 5: Update TripLayout to work with new Trip type**

In `app/src/layouts/TripLayout.tsx`:
- Replace `trip.dates` with formatted date range: `format(parseISO(trip.startDate), 'MMM d') + ' - ' + format(parseISO(trip.endDate), 'MMM d, yyyy')`
- Replace `trip.daysAway` with calculated value: `differenceInDays(parseISO(trip.startDate), new Date())`
- Replace the 3-stat grid (budget%, tasks%, bookings) with: Budget total, Days, and family member count (placeholder for now)

- [ ] **Step 6: Update TripBudget to use trip.budget**

In `app/src/pages/trip/TripBudget.tsx`:
- Get trip from outlet context: `const { trip } = useOutletContext<{ trip: Trip }>()`
- Replace `const totalBudget = 5000` with `const totalBudget = trip?.budget || 0`

- [ ] **Step 7: Verify the app builds**

```bash
cd /Users/mike/Projects/VacaVerse/app && npm run build 2>&1 | tail -20
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: fix Trip data model with real dates, budget, consolidate services"
```

---

## Chunk 4: Wire Real Data to Pages

### Task 9: Sync User Profile to Firestore on Auth

**Files:**
- Modify: `app/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Add user profile sync to AuthContext**

After the `onAuthStateChanged` callback sets the user, add a function that writes/updates the user profile to `users/{uid}` in Firestore. Use `setDoc` with `{ merge: true }` so it creates or updates.

```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Inside the onAuthStateChanged callback, after setUser(user):
if (user) {
    setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        photoURL: user.photoURL || null,
        createdAt: Date.now()
    }, { merge: true }).catch(console.error);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: sync user profile to Firestore on authentication"
```

---

### Task 10: Wire Home Page to Real Data

**Files:**
- Modify: `app/src/pages/Home.tsx`

- [ ] **Step 1: Replace hardcoded Home page with real data**

Rewrite Home.tsx to:
1. Use `useTrip()` to get the user's trips
2. Show the first upcoming trip (sorted by startDate) using TripCard with real data
3. Show "No upcoming trips" if empty, with a link to /trips
4. Remove hardcoded activities, tasks, and recent activity sections (these will come back in Phase 2 with the activity feed)
5. Keep the header with VacaVerse branding and user avatar from `useAuth()`
6. Keep the FAB button but link it to /trips

The page should be simple: header, upcoming trip card (or empty state), and FAB.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: wire Home page to real Firestore trip data"
```

---

### Task 11: Wire Family Page to Real Data

**Files:**
- Modify: `app/src/pages/Family.tsx`

- [ ] **Step 1: Replace mock family page with real data**

Rewrite Family.tsx to:
1. Use `useFamily()` to get families and currentFamily
2. If no families exist, show "Create your first family group" with a create button
3. Show a family selector if multiple families (simple dropdown or card list)
4. Show real family members (for now, just UIDs since we don't have profile resolution yet — this will be improved in Phase 2)
5. Remove the drag-and-drop reordering (unnecessary complexity for beta)
6. Remove all mock data
7. Keep the create family flow using `createFamily()` from FamilyContext
8. Add a simple modal for creating a new family (name input + create button)

- [ ] **Step 2: Commit**

```bash
git add src/pages/Family.tsx
git commit -m "feat: wire Family page to real Firestore data, remove mock members"
```

---

### Task 12: Wire Profile Stats to Real Data

**Files:**
- Modify: `app/src/pages/Profile.tsx`

- [ ] **Step 1: Update Profile stats to use real data**

In Profile.tsx:
1. Use `useTrip()` to get trip count: `trips.length`
2. Use `useFamily()` to get family count: `families.length`
3. Remove "Memories" stat (no such feature exists)
4. Show 2-column grid: Trips count and Families count

- [ ] **Step 2: Commit**

```bash
git add src/pages/Profile.tsx
git commit -m "feat: wire Profile stats to real trip and family counts"
```

---

### Task 13: Fix TripLayout — Load Trip from URL Params

**Files:**
- Modify: `app/src/layouts/TripLayout.tsx`

- [ ] **Step 1: Fix TripLayout to properly load trip from URL**

The current TripLayout uses `useTrip().trips` to find the trip by ID, but `currentTrip` is never set on the context. Fix this by:

1. Using `useParams()` to get `tripId`
2. Finding the trip in `useTrip().trips` (current approach, but handle loading better)
3. Passing the trip to child routes via Outlet context (already done)
4. Add a proper loading state that distinguishes "still loading" from "trip not found"

The key fix is in the loading state: check `loading` from `useTrip()` to differentiate loading vs not-found:

```typescript
const { trips, loading } = useTrip();
const trip = useMemo(() => trips.find(t => t.id === tripId), [trips, tripId]);

if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading trip...</div>;
}

if (!trip) {
    return (
        <div className="p-8 text-center">
            <p className="text-gray-400">Trip not found</p>
            <Link to="/trips" className="text-brand-teal mt-4 inline-block">Back to Trips</Link>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/TripLayout.tsx
git commit -m "fix: TripLayout properly handles loading state and trip-not-found"
```

---

### Task 14: Final Build Verification & Test Cleanup

- [ ] **Step 1: Run the build to verify everything compiles**

```bash
cd /Users/mike/Projects/VacaVerse/app && npm run build
```

Fix any TypeScript errors that arise from the type changes.

- [ ] **Step 2: Delete broken test files (they test old mock data patterns)**

```bash
rm -rf src/contexts/__tests__ src/pages/trip/__tests__
```

These tests tested against hardcoded mock data that no longer exists. They will be rewritten in a future task against the real Firestore-backed components.

- [ ] **Step 3: Verify the dev server starts**

```bash
npm run dev
```

Check that the app loads without errors in the browser.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove broken tests, verify clean build"
```

---

## Summary

After completing all 14 tasks in this plan, the app will have:

- Proper Firestore security rules (family-scoped access)
- Proper Storage security rules (user-scoped)
- Route protection (unauthenticated users redirected to login)
- Error boundaries (graceful error handling)
- Real Trip data model (ISO dates, user-defined budget, calculated countdown)
- Consolidated service layer (no duplicate trip creation logic)
- All mock/hardcoded data removed from Home, Family, and Profile pages
- Discover and Meals pages removed (cut from beta)
- User profiles synced to Firestore on auth
- Clean build with no broken tests

**Next plan:** Phase 2 — Collaboration Layer (invites, RSVP, activity feed, comments)
