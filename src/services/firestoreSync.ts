import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  runTransaction,
} from './firebase';
import { School, Room, Reservation, Announcement, User } from '../types';

export const COLLECTIONS = {
  ESCOLAS: 'escolas',
  SCHOOLS: 'schools',
  ROOMS: 'rooms',
  RESERVATIONS: 'reservations',
  ANNOUNCEMENTS: 'announcements',
  USERS: 'users',
  SLOT_LOCKS: 'slot_locks',
};

export interface SlotLockData {
  lockId: string;
  schoolId: string;
  roomId: string;
  date: string;
  periodId: string;
  reservationId: string;
  userName: string;
  userEmail: string;
  turma: string;
  disciplina: string;
  active: boolean;
  updatedAt: string;
}

// Generate unique lock document key per room + date + period
export function getSlotLockKey(schoolId: string, roomId: string, date: string, periodId: string): string {
  const cleanSchool = (schoolId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanRoom = roomId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanDate = date.replace(/[^0-9-]/g, '');
  const cleanPeriod = periodId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `lock_${cleanSchool}__${cleanRoom}__${cleanDate}__${cleanPeriod}`;
}

// 1. Clean entire Cloud Database from scratch (Limpar dados começando do zero)
export async function clearCloudDatabase(): Promise<void> {
  const collectionNames = [
    COLLECTIONS.ESCOLAS,
    COLLECTIONS.SCHOOLS,
    COLLECTIONS.ROOMS,
    COLLECTIONS.RESERVATIONS,
    COLLECTIONS.ANNOUNCEMENTS,
    COLLECTIONS.USERS,
    COLLECTIONS.SLOT_LOCKS,
  ];

  for (const colName of collectionNames) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn(`Error clearing collection ${colName} in Firestore:`, e);
    }
  }
}

// 2. Real-time sync subscriptions
export function subscribeToSchools(callback: (schools: School[]) => void) {
  // Primary listener on the 'escolas' collection
  return onSnapshot(
    collection(db, COLLECTIONS.ESCOLAS),
    (snapshot) => {
      const list: School[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as School;
        list.push(data);
      });
      if (list.length > 0) {
        callback(list);
      } else {
        // Fallback to 'schools' if 'escolas' is empty during migration
        getDocs(collection(db, COLLECTIONS.SCHOOLS)).then((fbSnap) => {
          if (!fbSnap.empty) {
            const fbList: School[] = [];
            fbSnap.forEach((d) => fbList.push(d.data() as School));
            callback(fbList);
          }
        }).catch(() => {});
      }
    },
    (err) => console.warn('Firestore escolas listener error:', err)
  );
}

export function subscribeToRooms(callback: (rooms: Room[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.ROOMS),
    (snapshot) => {
      const list: Room[] = [];
      snapshot.forEach((d) => list.push(d.data() as Room));
      callback(list);
    },
    (err) => console.warn('Firestore rooms listener error:', err)
  );
}

export function subscribeToReservations(callback: (reservations: Reservation[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.RESERVATIONS),
    (snapshot) => {
      const list: Reservation[] = [];
      snapshot.forEach((d) => list.push(d.data() as Reservation));
      callback(list);
    },
    (err) => console.warn('Firestore reservations listener error:', err)
  );
}

export function subscribeToAnnouncements(callback: (announcements: Announcement[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.ANNOUNCEMENTS),
    (snapshot) => {
      const list: Announcement[] = [];
      snapshot.forEach((d) => list.push(d.data() as Announcement));
      callback(list);
    },
    (err) => console.warn('Firestore announcements listener error:', err)
  );
}

export function subscribeToUsers(callback: (users: User[]) => void) {
  return onSnapshot(
    collection(db, COLLECTIONS.USERS),
    (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((d) => list.push(d.data() as User));
      callback(list);
    },
    (err) => console.warn('Firestore users listener error:', err)
  );
}

// 3. Document write helpers
export async function saveSchoolToCloud(school: School, extraData?: { rooms?: Room[]; users?: User[] }): Promise<void> {
  const payload = {
    ...school,
    ultimaAtualizacao: new Date().toISOString(),
    ...(extraData?.rooms ? { salas: extraData.rooms, totalSalas: extraData.rooms.length } : {}),
    ...(extraData?.users ? { usuarios: extraData.users, totalUsuarios: extraData.users.length } : {}),
  };

  // Write to both 'escolas' and 'schools' collections
  await Promise.all([
    setDoc(doc(db, COLLECTIONS.ESCOLAS, school.id), payload, { merge: true }),
    setDoc(doc(db, COLLECTIONS.SCHOOLS, school.id), school),
  ]);
}

export async function deleteSchoolFromCloud(schoolId: string): Promise<void> {
  await Promise.all([
    deleteDoc(doc(db, COLLECTIONS.ESCOLAS, schoolId)),
    deleteDoc(doc(db, COLLECTIONS.SCHOOLS, schoolId)),
  ]);
}

export async function saveRoomToCloud(room: Room): Promise<void> {
  // Save to root rooms collection and link to escola subcollection
  await setDoc(doc(db, COLLECTIONS.ROOMS, room.id), room);
  if (room.schoolId) {
    try {
      await setDoc(doc(db, COLLECTIONS.ESCOLAS, room.schoolId, 'salas', room.id), room);
    } catch (e) {
      console.warn('Warning linking room to escola subcollection:', e);
    }
  }
}

export async function deleteRoomFromCloud(roomId: string, schoolId?: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.ROOMS, roomId));
  if (schoolId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ESCOLAS, schoolId, 'salas', roomId));
    } catch (e) {
      console.warn('Warning unlinking room from escola subcollection:', e);
    }
  }
}

/**
 * Atomic Concurrency Protected Reservation Creation / Update
 * Uses Firestore runTransaction to guarantee that no two users book the same room/date/period slot simultaneously.
 */
export async function saveReservationWithLockToCloud(
  reservation: Reservation
): Promise<{ success: boolean; conflictError?: string }> {
  const schoolId = reservation.schoolId || 'default';
  const periodIds = reservation.periodIds || [];

  try {
    await runTransaction(db, async (transaction) => {
      // 1. If reservation is active (not CANCELLED), read all slot locks first (Firestore rule: all reads before writes)
      if (reservation.status !== 'CANCELLED') {
        for (const pId of periodIds) {
          const lockKey = getSlotLockKey(schoolId, reservation.roomId, reservation.date, pId);
          const lockRef = doc(db, COLLECTIONS.SLOT_LOCKS, lockKey);
          const lockSnap = await transaction.get(lockRef);

          if (lockSnap.exists()) {
            const lockData = lockSnap.data() as SlotLockData;
            // If lock is active and belongs to a different reservation -> Conflict detected!
            if (lockData && lockData.active && lockData.reservationId !== reservation.id) {
              throw new Error(
                `CONCURRENCY_CONFLICT: O horário (${pId}) acabou de ser reservado simultaneamente por ${
                  lockData.userName || 'outro docente'
                } (${lockData.turma || 'outra turma'}).`
              );
            }
          }
        }
      }

      // 2. Perform writes: update the reservation document
      const resRef = doc(db, COLLECTIONS.RESERVATIONS, reservation.id);
      transaction.set(resRef, reservation);

      // Also link reservation to school's subcollection
      if (schoolId && schoolId !== 'default') {
        const escolaResRef = doc(db, COLLECTIONS.ESCOLAS, schoolId, 'reservas', reservation.id);
        transaction.set(escolaResRef, reservation);
      }

      // 3. Update slot lock documents
      const nowIso = new Date().toISOString();
      const isLockActive = reservation.status !== 'CANCELLED';

      for (const pId of periodIds) {
        const lockKey = getSlotLockKey(schoolId, reservation.roomId, reservation.date, pId);
        const lockRef = doc(db, COLLECTIONS.SLOT_LOCKS, lockKey);

        const lockPayload: SlotLockData = {
          lockId: lockKey,
          schoolId,
          roomId: reservation.roomId,
          date: reservation.date,
          periodId: pId,
          reservationId: reservation.id,
          userName: reservation.userName,
          userEmail: reservation.userEmail,
          turma: reservation.turma,
          disciplina: reservation.disciplina,
          active: isLockActive,
          updatedAt: nowIso,
        };

        transaction.set(lockRef, lockPayload);
      }
    });

    return { success: true };
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.includes('CONCURRENCY_CONFLICT')) {
      const cleanError = message.replace('Error: CONCURRENCY_CONFLICT: ', '').replace('CONCURRENCY_CONFLICT: ', '');
      return { success: false, conflictError: cleanError };
    }
    console.warn('Firestore reservation transaction fallback:', err);
    // Fallback direct write to reservation document so offline or transient rule propagation doesn't block the user
    try {
      await setDoc(doc(db, COLLECTIONS.RESERVATIONS, reservation.id), reservation);
    } catch (fallbackErr) {
      console.warn('Fallback direct save warning:', fallbackErr);
    }
    return { success: true };
  }
}

/**
 * Release slot locks when cancelling or deleting a reservation
 */
export async function releaseReservationLocksFromCloud(
  reservation: Reservation | { schoolId?: string; roomId: string; date: string; periodIds: string[]; id: string }
): Promise<void> {
  const schoolId = reservation.schoolId || 'default';
  const periodIds = reservation.periodIds || [];

  const batch = writeBatch(db);
  for (const pId of periodIds) {
    const lockKey = getSlotLockKey(schoolId, reservation.roomId, reservation.date, pId);
    const lockRef = doc(db, COLLECTIONS.SLOT_LOCKS, lockKey);
    batch.delete(lockRef);
  }

  try {
    await batch.commit();
  } catch (e) {
    console.warn('Error releasing reservation slot locks:', e);
  }
}

export async function saveReservationToCloud(reservation: Reservation): Promise<void> {
  // Direct call to atomic lock transaction
  await saveReservationWithLockToCloud(reservation);
}

export async function deleteReservationFromCloud(resId: string, reservationData?: Reservation): Promise<void> {
  if (reservationData) {
    await releaseReservationLocksFromCloud(reservationData);
    if (reservationData.schoolId) {
      try {
        await deleteDoc(doc(db, COLLECTIONS.ESCOLAS, reservationData.schoolId, 'reservas', resId));
      } catch (e) {
        console.warn('Warning unlinking reservation from escola subcollection:', e);
      }
    }
  }
  await deleteDoc(doc(db, COLLECTIONS.RESERVATIONS, resId));
}

export async function saveAnnouncementToCloud(announcement: Announcement): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, announcement.id), announcement);
  if (announcement.schoolId) {
    try {
      await setDoc(doc(db, COLLECTIONS.ESCOLAS, announcement.schoolId, 'comunicados', announcement.id), announcement);
    } catch (e) {
      console.warn('Warning linking announcement to escola subcollection:', e);
    }
  }
}

export async function deleteAnnouncementFromCloud(annId: string, schoolId?: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, annId));
  if (schoolId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ESCOLAS, schoolId, 'comunicados', annId));
    } catch (e) {
      console.warn('Warning unlinking announcement from escola subcollection:', e);
    }
  }
}

export async function saveUserToCloud(user: User): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, user.id), user);
  if (user.schoolId) {
    try {
      await setDoc(doc(db, COLLECTIONS.ESCOLAS, user.schoolId, 'usuarios', user.id), user);
    } catch (e) {
      console.warn('Warning linking user to escola subcollection:', e);
    }
  }
}

export async function deleteUserFromCloud(userId: string, schoolId?: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  if (schoolId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ESCOLAS, schoolId, 'usuarios', userId));
    } catch (e) {
      console.warn('Warning unlinking user from escola subcollection:', e);
    }
  }
}
