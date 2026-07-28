import mongoose from 'mongoose';

/**
 * Runs a callback inside a Mongoose transaction session if supported by MongoDB (Replica Set or mongos).
 * Automatically falls back to session-less execution if running on a standalone MongoDB instance.
 */
export const runInTransaction = async (callback) => {
  let session = null;
  let useSession = true;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    useSession = false;
    if (session) {
      try { session.endSession(); } catch (e) {}
      session = null;
    }
  }

  if (!useSession) {
    return await callback(null);
  }

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session && session.inTransaction()) {
      try { await session.abortTransaction(); } catch (e) {}
    }

    const isStandaloneError =
      error.message?.includes('replica set member') ||
      error.message?.includes('Transaction numbers are only allowed') ||
      error.code === 20;

    if (isStandaloneError) {
      return await callback(null);
    }

    throw error;
  } finally {
    if (session) {
      try { session.endSession(); } catch (e) {}
    }
  }
};
