import connectDB, { disconnectDB } from '../src/config/db.js';
import Message from '../src/models/Message.js';

async function fix() {
  await connectDB();
  const staffRes = await Message.updateMany({ message: { $regex: 'staff', $options: 'i' } }, { $set: { channel: 'STAFF' } });
  const clientRes = await Message.updateMany({ message: { $regex: 'client', $options: 'i' } }, { $set: { channel: 'CLIENT' } });
  console.log(`Updated ${staffRes.modifiedCount} staff messages and ${clientRes.modifiedCount} client messages.`);
  await disconnectDB();
  process.exit(0);
}

fix().catch((err) => {
  console.error(err);
  process.exit(1);
});
