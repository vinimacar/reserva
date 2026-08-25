import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from './firebase';
import { School, Room, Reservation, Announcement, User } from '../types';

export const COLLECTIONS = {
  SCHOOLS: 'schools',
  ROOMS: 'rooms',
  RESERVATIONS: 'reservations',
  ANNOUNCEMENTS: 'announcements',
  USERS: 'users',
};

// 1. Clean entire Cloud Database from scratch (Limpar dados começando do zero)
export async function clearCloudDatabase(): Promise<void> {
  const collectionNames = [
    COLLECTIONS.SCHOOLS,
    COLLECTIONS.ROOMS,
    COLLECTIONS.RESERVATIONS,
    COLLECTIONS.ANNOUNCEMENTS,
    COLLECTIONS.USERS,
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

export async function saveReservationToCloud(reservation: Reservation): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.RESERVATIONS, reservation.id), reservation);
}

export async function deleteReservationFromCloud(resId: string): Promise<void> {
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
