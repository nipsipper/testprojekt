console.log("Lade Module...");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
const PORT = 3000;
const JWT_SECRET = "dein_geheimes_jwt_geheimnis_123";

console.log("Middleware initialisiert");
app.use(cors());
app.use(express.json());

// MongoDB-Verbindung
mongoose.connect("mongodb+srv://kirschehd:P4HqL81K4z8XTTmQ@cluster0.tmrb8vg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("Verbunden mit MongoDB");
  })
  .catch(err => {
    console.error("Fehler bei MongoDB-Verbindung:", err);
    process.exit(1);
  });

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: null },
});
const User = mongoose.model("User", userSchema);

// Thread Schema
const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  author: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  subcategoryId: Number,
  replies: [{
    content: { type: String, required: true },
    author: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  }],
  reactions: [{
    user: { type: String, required: true },
    type: { type: String, required: true, enum: ["like", "heart", "sad"] },
  }],
});
const Thread = mongoose.model("Thread", threadSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Kein Token bereitgestellt" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token-Verifizierungsfehler:", err.message);
      return res.status(401).json({ error: "Ungültiger oder abgelaufener Token" });
    }
    req.user = user;
    next();
  });
};

// Endpunkte
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Benutzername und Passwort erforderlich" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Benutzername bereits vergeben" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      profilePicture: `https://robohash.org/${username}?set=set4`,
    });
    await user.save();
    res.status(201).json({ message: "Benutzer registriert" });
  } catch (error) {
    console.error("Fehler bei Registrierung:", error);
    res.status(500).json({ error: "Serverfehler" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Benutzername und Passwort erforderlich" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Ungültige Anmeldedaten" });
    }

    // Stelle sicher, dass profilePicture gesetzt ist
    if (!user.profilePicture) {
      user.profilePicture = `https://robohash.org/${username}?set=set4`;
      await user.save();
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Ungültige Anmeldedaten" });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ username: user.username, token, profilePicture: user.profilePicture });
  } catch (error) {
    console.error("Fehler bei Anmeldung:", error);
    res.status(500).json({ error: "Serverfehler" });
  }
});

app.get("/api/threads", async (req, res) => {
  const { subcategoryId, categoryId, subcategoryIds } = req.query;
  try {
    let threads;
    if (subcategoryId) {
      threads = await Thread.find({ subcategoryId: parseFloat(subcategoryId) });
    } else if (categoryId && subcategoryIds) {
      const subIds = subcategoryIds.split(",").map(id => parseFloat(id));
      threads = await Thread.find({ subcategoryId: { $in: subIds } });
    } else {
      threads = await Thread.find();
    }
    // Füge profilePicture mit Fallback hinzu
    const enrichedThreads = await Promise.all(threads.map(async (thread) => {
      const user = await User.findOne({ username: thread.author });
      let profilePicture = user?.profilePicture;
      if (!profilePicture) {
        profilePicture = `https://robohash.org/${thread.author}?set=set4`;
        await User.updateOne(
          { username: thread.author },
          { $set: { profilePicture } }
        );
      }
      const enrichedReplies = await Promise.all(thread.replies.map(async (reply) => {
        const replyUser = await User.findOne({ username: reply.author });
        let replyProfilePicture = replyUser?.profilePicture;
        if (!replyProfilePicture) {
          replyProfilePicture = `https://robohash.org/${reply.author}?set=set4`;
          await User.updateOne(
            { username: reply.author },
            { $set: { profilePicture: replyProfilePicture } }
          );
        }
        return { ...reply.toObject(), profilePicture: replyProfilePicture };
      }));
      return {
        ...thread.toObject(),
        profilePicture,
        replies: enrichedReplies,
      };
    }));
    res.json(enrichedThreads);
  } catch (error) {
    console.error("Fehler beim Abrufen der Threads:", error);
    res.status(500).json({ error: "Serverfehler" });
  }
});

app.get("/api/threads/:id", async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: "Thread nicht gefunden" });
    }
    // Füge profilePicture mit Fallback hinzu
    const user = await User.findOne({ username: thread.author });
    let profilePicture = user?.profilePicture;
    if (!profilePicture) {
      profilePicture = `https://robohash.org/${thread.author}?set=set4`;
      await User.updateOne(
        { username: thread.author },
        { $set: { profilePicture } }
      );
    }
    const enrichedReplies = await Promise.all(thread.replies.map(async (reply) => {
      const replyUser = await User.findOne({ username: reply.author });
      let replyProfilePicture = replyUser?.profilePicture;
      if (!replyProfilePicture) {
        replyProfilePicture = `https://robohash.org/${reply.author}?set=set4`;
        await User.updateOne(
          { username: reply.author },
          { $set: { profilePicture: replyProfilePicture } }
        );
      }
      return { ...reply.toObject(), profilePicture: replyProfilePicture };
    }));
    const enrichedThread = {
      ...thread.toObject(),
      profilePicture,
      replies: enrichedReplies,
    };
    res.json(enrichedThread);
  } catch (error) {
    console.error("Fehler beim Abrufen des Threads:", error);
    res.status(500).json({ error: "Serverfehler" });
  }
});

app.post("/api/threads", authenticateToken, async (req, res) => {
  const { title, content, subcategoryId } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Titel erforderlich" });
  }

  try {
    const user = await User.findOne({ username: req.user.username });
    let profilePicture = user?.profilePicture;
    if (!profilePicture) {
      profilePicture = `https://robohash.org/${req.user.username}?set=set4`;
      await User.updateOne(
        { username: req.user.username },
        { $set: { profilePicture } }
      );
    }
    const thread = new Thread({
      title,
      content,
      author: req.user.username,
      subcategoryId: subcategoryId ? parseFloat(subcategoryId) : null,
      replies: [],
      reactions: [],
    });
    await thread.save();
    res.status(201).json({
      ...thread.toObject(),
      profilePicture,
    });
  } catch (error) {
    console.error("Fehler beim Erstellen des Threads:", error);
    res.status(500).json({ error: "Serverfehler" });
  }
});

app.post("/api/threads/:id/replies", authenticateToken, async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Inhalt erforderlich" });
  }

  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: "Thread nicht gefunden" });
    }

    thread.replies.push({
      content,
      author: req.user.username,
    });
    await thread.save();
    const user = await User.findOne({ username: req.user.username });
    let profilePicture = user?.profilePicture;
    if (!profilePicture) {
      profilePicture = `https://robohash.org/${req.user.username}?set=set4`;
      await User.updateOne(
        { username: req.user.username },
        { $set: { profilePicture } }
      );
    }
    const enrichedReplies = await Promise.all(thread.replies.map(async (reply) => {
      const replyUser = await User.findOne({ username: reply.author });
      let replyProfilePicture = replyUser?.profilePicture;
      if (!replyProfilePicture) {
        replyProfilePicture = `https://robohash.org/${reply.author}?set=set4`;
        await User.updateOne(
          { username: reply.author },
          { $set: { profilePicture: replyProfilePicture } }
        );
      }
      return { ...reply.toObject(), profilePicture: replyProfilePicture };
    }));
    res.json({
      ...thread.toObject(),
      profilePicture,
      replies: enrichedReplies,
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Antwort:", error);
    res.status(500).json({ error: "Serverfehler" });
  }
});

app.post("/api/threads/:id/reactions", authenticateToken, async (req, res) => {
  const { type } = req.body;
  if (!type || !["like", "heart", "sad"].includes(type)) {
    return res.status(400).json({ error: "Ungültiger Reaktionstyp" });
  }

  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ error: "Thread nicht gefunden" });
    }

    thread.reactions = thread.reactions.filter(r => r.user !== req.user.username);
    thread.reactions.push({ user: req.user.username, type });
    await thread.save();
    const user = await User.findOne({ username: thread.author });
    let profilePicture = user?.profilePicture;
    if (!profilePicture) {
      profilePicture = `https://robohash.org/${thread.author}?set=set4`;
      await User.updateOne(
        { username: thread.author },
        { $set: { profilePicture } }
      );
    }
    const enrichedReplies = await Promise.all(thread.replies.map(async (reply) => {
      const replyUser = await User.findOne({ username: reply.author });
      let replyProfilePicture = replyUser?.profilePicture;
      if (!replyProfilePicture) {
        replyProfilePicture = `https://robohash.org/${reply.author}?set=set4`;
        await User.updateOne(
          { username: reply.author },
          { $set: { profilePicture: replyProfilePicture } }
        );
      }
      return { ...reply.toObject(), profilePicture: replyProfilePicture };
    }));
    res.json({
      ...thread.toObject(),
      profilePicture,
      replies: enrichedReplies,
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Reaktion:", error);
    res.status(500).json({ error: "Serverfehler" });
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});