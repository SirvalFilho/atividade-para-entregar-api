import express from "express";
import cors from "cors";
import crypto from "crypto";

const server = express();

// Configuração CORS mais permissiva
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3003",
      "http://localhost:3003",
      "http://localhost:5173",
      "http://localhost:4173",
    ].filter(Boolean); // Remove undefined/null

    if (!process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    if (
      allowedOrigins.some((allowed) =>
        origin.includes(allowed.replace(/https?:\/\//, ""))
      )
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Temporariamente permitir para debug
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "user-token"],
};

server.use(cors(corsOptions));
server.use(express.json());

let users = [];
let likes = [];
let idCounter = 1;

const generateId = () => String(idCounter++);

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const authMiddleware = async (req, res, next) => {
  try {
    const userId = req.headers["user-token"];
    if (!userId) {
      return res.status(401).send({ error: "No user token provided" });
    }
    const user = users.find((u) => u._id === userId);
    if (!user) {
      return res.status(401).send({ error: "User not found" });
    }
    req.current_user = user;
    next();
  } catch (error) {
    return res.status(401).send({ error: "Invalid user token" });
  }
};

server.get("/health", (_, res) => {
  res.send({ message: "Alive", users: users.length });
});

server.post("/users", async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      gender,
      dateOfBirth,
      preference,
      interests,
    } = req.body;

    const user = {
      _id: generateId(),
      username,
      password: hashPassword(password),
      name: name || "",
      gender: gender || "",
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      preference: preference || "",
      interests: interests || [],
    };

    users.push(user);

    res.status(201).send(user);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

server.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = hashPassword(password);
  const user = users.find(
    (u) => u.username === username && u.password === hashedPassword
  );

  if (!user) {
    return res.status(401).send({ error: "Invalid credentials" });
  }

  res.send(user);
});

server.put("/users/:id/profile", async (req, res) => {
  const { id } = req.params;
  const { name, gender, dateOfBirth, preference } = req.body;

  const user = users.find((u) => u._id === id);
  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }

  user.name = name || user.name;
  user.gender = gender || user.gender;
  user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : user.dateOfBirth;
  user.preference = preference || user.preference;

  res.send(user);
});

server.put("/users/:id/interests", async (req, res) => {
  const { id } = req.params;
  const { interests } = req.body;

  const user = users.find((u) => u._id === id);
  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }

  user.interests = interests;
  res.send(user);
});

server.get("/users/discover", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.current_user._id;
    const currentUserPreference = req.current_user.preference;
    const currentUserGender = req.current_user.gender;

    const likedUserIds = likes
      .filter((like) => like.curtidor === currentUserId)
      .map((like) => like.curtido);

    const availableUsers = users.filter((u) => {
      // Nunca mostrar o próprio usuário
      if (u._id === currentUserId) return false;

      // Não mostrar usuários já curtidos
      if (likedUserIds.includes(u._id)) return false;

      // Lógica de compatibilidade de preferências
      let isCompatible = false;

      // Se eu prefiro homens
      if (currentUserPreference === "Men") {
        // Só mostrar se for homem E ele tiver preferência compatível comigo
        if (u.gender === "Male") {
          if (currentUserGender === "Male" && u.preference === "Men")
            isCompatible = true;
          if (currentUserGender === "Female" && u.preference === "Women")
            isCompatible = true;
          if (u.preference === "Both") isCompatible = true;
          if (u.preference === "Other") isCompatible = true;
        }
      }
      // Se eu prefiro mulheres
      else if (currentUserPreference === "Women") {
        // Só mostrar se for mulher E ela tiver preferência compatível comigo
        if (u.gender === "Female") {
          if (currentUserGender === "Male" && u.preference === "Men")
            isCompatible = true;
          if (currentUserGender === "Female" && u.preference === "Women")
            isCompatible = true;
          if (u.preference === "Both") isCompatible = true;
          if (u.preference === "Other") isCompatible = true;
        }
      }
      // Se eu prefiro ambos
      else if (currentUserPreference === "Both") {
        if (u.gender === "Male") {
          if (currentUserGender === "Male" && u.preference === "Men")
            isCompatible = true;
          if (currentUserGender === "Female" && u.preference === "Women")
            isCompatible = true;
          if (u.preference === "Both") isCompatible = true;
          if (u.preference === "Other") isCompatible = true;
        } else if (u.gender === "Female") {
          if (currentUserGender === "Male" && u.preference === "Men")
            isCompatible = true;
          if (currentUserGender === "Female" && u.preference === "Women")
            isCompatible = true;
          if (u.preference === "Both") isCompatible = true;
          if (u.preference === "Other") isCompatible = true;
        }
      }
      // Se eu prefiro outros
      else if (currentUserPreference === "Other") {
        isCompatible = true;
      }

      return isCompatible;
    });

    res.send(availableUsers);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

server.post("/likes/swipe", authMiddleware, async (req, res) => {
  try {
    const { targetUserId, action } = req.body;

    if (action === "dislike") {
      likes.push({
        _id: generateId(),
        curtidor: req.current_user._id,
        curtido: targetUserId,
        type: "dislike",
      });
      return res.send({ match: false });
    }

    const targetUser = users.find((u) => u._id === targetUserId);

    if (!targetUser) {
      return res.status(404).send({ error: "User not found" });
    }

    likes.push({
      _id: generateId(),
      curtidor: req.current_user._id,
      curtido: targetUserId,
      type: "like",
    });

    const reverseMatch = likes.find(
      (like) =>
        like.curtidor === targetUserId &&
        like.curtido === req.current_user._id &&
        like.type === "like"
    );

    const isMatch = !!reverseMatch;

    res.send({
      match: isMatch,
      matchedUser: isMatch ? targetUser : null,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

server.get("/matches", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.current_user._id;

    const userLikes = likes.filter(
      (like) => like.curtidor === currentUserId && like.type === "like"
    );
    const likedUserIds = userLikes.map((like) => like.curtido);

    const matchedIds = likes
      .filter(
        (like) =>
          likedUserIds.includes(like.curtidor) &&
          like.curtido === currentUserId &&
          like.type === "like"
      )
      .map((like) => like.curtidor);

    const matchedUsers = users.filter((u) => matchedIds.includes(u._id));

    res.send(matchedUsers);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const port = process.env.PORT || 3003;
server.listen(port, () => console.log(`Server listening on ${port}`));
