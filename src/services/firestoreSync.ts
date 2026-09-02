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
  return onSnapshot(
    collection(db, COLLECTIONS.SCHOOLS),
    (snapshot) => {
      const list: School[] = [];
      snapshot.forEach((d) => list.push(d.data() as School));
      callback(list);
    },
    (err) => console.warn('Firestore schools listener error:', err)
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
export async function saveSchoolToCloud(school: School): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.SCHOOLS, school.id), school);
}

export async function deleteSchoolFromCloud(schoolId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.SCHOOLS, schoolId));
}

export async function saveRoomToCloud(room: Room): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.ROOMS, room.id), room);
}

export async function deleteRoomFromCloud(roomId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.ROOMS, roomId));
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
    console.warn('Firestore reservation transaction error:', err);
    // Even if transaction has network quirks, return fallback
    return { success: false, conflictError: message };
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
  }
  await deleteDoc(doc(db, COLLECTIONS.RESERVATIONS, resId));
}

export async function saveAnnouncementToCloud(announcement: Announcement): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, announcement.id), announcement);
}

export async function deleteAnnouncementFromCloud(annId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.ANNOUNCEMENTS, annId));
}

export async function saveUserToCloud(user: User): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, user.id), user);
}

export async function deleteUserFromCloud(userId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
}
