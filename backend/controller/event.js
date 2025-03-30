const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const roleHierarchy = { REGULAR: 1, CASHIER: 2, MANAGER: 3, SUPERUSER: 4 };

/**
 * create new point-earning event
 * payload:
 *  - name: string (name of event)
 *  - description: string (description of event)
 *  - location: string (location of event)
 *  - startTime: string (iso 8601 format)
 *  - endTime: string (iso 8601 format, must be after startTime)
 *  - capacity: number (positive number or null)
 *  - points: number (points allocated)
 */
async function createEvent(req, res) {
  const { name, description, location, startTime, endTime, capacity, points } =
    req.body;

  if (
    !name ||
    !description ||
    !location ||
    !startTime ||
    !endTime ||
    points == null
  ) {
    return res.status(400).json({ error: "missing required fields" });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "invalid date format" });
  }

  if (end <= start) {
    return res.status(400).json({ error: "endTime must be after startTime" });
  }

  if (capacity != null && capacity !== null) {
    if (typeof capacity !== "number" || capacity <= 0) {
      return res
        .status(400)
        .json({ error: "capacity must be a positive number or null" });
    }
  }

  if (typeof points !== "number" || points < 0) {
    return res
      .status(400)
      .json({ error: "points must be a non-negative number" });
  }

  try {
    const event = await prisma.event.create({
      data: {
        name,
        description,
        location,
        startTime: start,
        endTime: end,
        capacity: capacity == null ? null : capacity,
        totalPoints: points,
        pointsAwarded: 0,
        published: false,
      },
    });

    const pointsRemain = event.totalPoints - event.pointsAwarded;
    return res.status(201).json({
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      capacity: event.capacity,
      pointsRemain,
      pointsAwarded: event.pointsAwarded,
      published: event.published,
      organizers: [],
      guests: [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error while creating event" });
  }
}

/**
 * list events
 * payload:
 *  - name: string (filter by name)
 *  - location: string (filter by location)
 *  - started: boolean (filter by events that have started, cannot be used with ended)
 *  - ended: boolean (filter by events that have ended, cannot be used with started)
 *  - showFull: boolean (show events that are full, default false)
 *  - page: number (page number, default 1)
 *  - limit: number (number per page, default 10)
 *  - published: boolean (only for manager or higher)
 */
async function listEvents(req, res) {
  const {
    name,
    location,
    started,
    ended,
    showFull,
    page = 1,
    limit = 10,
    published,
  } = req.query;

  if (started != null && ended != null) {
    return res
      .status(400)
      .json({ error: "cannot specify both started and ended" });
  }

  const now = new Date();
  let where = {};
  if (name) {
    where.name = { contains: name };
  }

  if (location) {
    where.location = { contains: location };
  }

  if (started != null) {
    if (started === "true") {
      where.startTime = { lte: now };
    } else if (started === "false") {
      where.startTime = { gt: now };
    }
  }
  if (ended != null) {
    if (ended === "true") {
      where.endTime = { lte: now };
    } else if (ended === "false") {
      where.endTime = { gt: now };
    }
  }

  // regular users cannot see unpublished events

  if (roleHierarchy[req.user.role] < roleHierarchy["MANAGER"]) {
    where.published = true;
  } else {
    if (published != null) {
      if (published === "true") {
        where.published = true;
      } else if (published === "false") {
        where.published = false;
      }
    }
  }

  try {
    const eventsRaw = await prisma.event.findMany({
      where,
      include: { _count: { select: { eventGuests: true } } },
      orderBy: { startTime: "asc" },
    });

    const showFullBool = showFull === "true";
    let filtered = eventsRaw;
    if (!showFullBool) {
      filtered = eventsRaw.filter((event) => {
        if (event.capacity === null) return true;
        return event._count.eventGuests < event.capacity;
      });
    }

    if (page != null && (!Number(page) || Number(page) <= 0)) {
      return res
        .status(400)
        .json({ error: "page must be a postive number" });
    }
    if (limit != null && (!Number(limit) || Number(limit) <= 0)) {
      return res
        .status(400)
        .json({ error: "limit must be a postive number" });
    }
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    const total = filtered.length;
    const startIndex = (p - 1) * l;
    const paginated = filtered.slice(startIndex, startIndex + l);

    const results = paginated.map((event) => {
      const base = {
        id: event.id,
        name: event.name,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        capacity: event.capacity,
        numGuests: event._count.eventGuests,
      };

      if (roleHierarchy[req.user.role] >= roleHierarchy["MANAGER"]) {
        return {
          ...base,
          pointsRemain: event.totalPoints - event.pointsAwarded,
          pointsAwarded: event.pointsAwarded,
          published: event.published,
        };
      } else {
        return base;
      }
    });

    return res.json({ count: total, results });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while retrieving events" });
  }
}

/**
 * get single event
 * no payload
 * regular view: if event not published, return 404; manager/organizer view: full info
 */
async function getEvent(req, res) {
  const eventId = Number(req.params.eventId);
  if (isNaN(eventId)) {
    return res.status(400).json({ error: "invalid event id" });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventOrganizers: { include: { user: true } },
        eventGuests: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: "event not found" });
    }

    const isOrganizer = event.eventOrganizers.some(
      (eo) => eo.user.id === req.user.id
    );

    // regular users (not manager/organizer) can only see published events
    if (roleHierarchy[req.user.role] < roleHierarchy.MANAGER && !isOrganizer) {
      if (!event.published) {
        return res.status(404).json({ error: "event not found" });
      }

      return res.json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        capacity: event.capacity,
        organizers: event.eventOrganizers.map((eo) => ({
          id: eo.user.id,
          utorid: eo.user.utorid,
          name: eo.user.name,
        })),
        numGuests: event.eventGuests.length,
      });
    } else {
      return res.json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        capacity: event.capacity,
        pointsRemain: event.totalPoints - event.pointsAwarded,
        pointsAwarded: event.pointsAwarded,
        published: event.published,
        organizers: event.eventOrganizers.map((eo) => ({
          id: eo.user.id,
          utorid: eo.user.utorid,
          name: eo.user.name,
        })),
        guests: event.eventGuests.map((eg) => ({
          id: eg.userId,
        })),
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while retrieving event" });
  }
}

/**
 * update event
 * payload:
 *  - name: string (name of event)
 *  - description: string (description of event)
 *  - location: string (location of event)
 *  - startTime: string (iso 8601 format)
 *  - endTime: string (iso 8601 format, must be after startTime)
 *  - capacity: number (positive number or null)
 *  - points: number (only by managers)
 *  - published: boolean (only by managers; can only be set to true)
 */
async function updateEvent(req, res) {
  const eventId = Number(req.params.eventId);
  if (isNaN(eventId)) {
    return res.status(400).json({ error: "invalid event id" });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventGuests: true,
      eventOrganizers: { include: { user: true } },
    },
  });

  if (!event) {
    return res.status(404).json({ error: "event not found" });
  }

  const isOrganizer = event.eventOrganizers.some(
    (eo) => eo.user.id === req.user.id
  );

  if (roleHierarchy[req.user.role] < roleHierarchy.MANAGER && !isOrganizer) {
    return res.status(403).json({ error: "forbidden" });
  }
  const now = new Date();
  const eventStarted = event.startTime <= now;
  const eventEnded = event.endTime <= now;
  const updateData = {};
  const responseData = {
    id: event.id,
    name: event.name,
    location: event.location,
  };

  if (req.body.name != null) {
    if (eventStarted) {
      return res
        .status(400)
        .json({ error: "cannot update name after event has started" });
    }
    updateData.name = req.body.name;
    responseData.name = req.body.name;
  }

  if (req.body.description != null) {
    if (eventStarted) {
      return res
        .status(400)
        .json({ error: "cannot update description after event has started" });
    }
    updateData.description = req.body.description;
    responseData.description = req.body.description;
  }

  if (req.body.location != null) {
    if (eventStarted) {
      return res
        .status(400)
        .json({ error: "cannot update location after event has started" });
    }
    updateData.location = req.body.location;
    responseData.location = req.body.location;
  }

  if (req.body.startTime != null) {
    if (eventStarted) {
      return res
        .status(400)
        .json({ error: "cannot update startTime after event has started" });
    }

    const newStart = new Date(req.body.startTime);
    if (isNaN(newStart.getTime()) || newStart < now) {
      return res
        .status(400)
        .json({ error: "invalid startTime; must be in future" });
    }
    updateData.startTime = newStart;
    responseData.startTime = newStart.toISOString();
  }

  if (req.body.endTime != null) {
    if (eventEnded) {
      return res
        .status(400)
        .json({ error: "cannot update endTime after event has ended" });
    }

    const newEnd = new Date(req.body.endTime);
    if (isNaN(newEnd.getTime())) {
      return res.status(400).json({ error: "invalid endTime" });
    }

    const effectiveStart = updateData.startTime
      ? updateData.startTime
      : event.startTime;
    if (newEnd <= effectiveStart) {
      return res.status(400).json({ error: "endTime must be after startTime" });
    }
    updateData.endTime = newEnd;
    responseData.endTime = newEnd.toISOString();
  }

  if (req.body.capacity != null) {
    if (eventStarted) {
      return res
        .status(400)
        .json({ error: "cannot update capacity after event has started" });
    }

    const newCap = req.body.capacity;
    if (newCap != null && (typeof newCap !== "number" || newCap <= 0)) {
      return res
        .status(400)
        .json({ error: "capacity must be positive number or null" });
    }

    if (newCap != null && event.eventGuests.length > newCap) {
      return res
        .status(400)
        .json({ error: "new capacity is less than confirmed guests" });
    }
    updateData.capacity = newCap;
    responseData.capacity = newCap;
  }
  if (req.body.points != null) {
    if (roleHierarchy[req.user.role] < roleHierarchy.MANAGER) {
      return res.status(403).json({ error: "forbidden to update points" });
    }

    const newPoints = req.body.points;
    if (typeof newPoints !== "number" || newPoints < 0) {
      return res
        .status(400)
        .json({ error: "points must be non-negative number" });
    }

    if (newPoints < event.pointsAwarded) {
      return res
        .status(400)
        .json({ error: "new total points less than points already awarded" });
    }
    updateData.totalPoints = newPoints;
    responseData.pointsRemain = newPoints - event.pointsAwarded;
    responseData.pointsAwarded = event.pointsAwarded;
  }
  if (req.body.published != null) {
    if (roleHierarchy[req.user.role] < roleHierarchy.MANAGER) {
      return res.status(403).json({ error: "forbidden to update published" });
    }

    if (req.body.published !== true) {
      return res
        .status(400)
        .json({ error: "published can only be set to true" });
    }
    updateData.published = true;
    responseData.published = true;
  }

  try {
    await prisma.event.update({
      where: { id: event.id },
      data: updateData,
    });

    return res.json(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error while updating event" });
  }
}

/**
 * delete event
 * no payload
 */
async function deleteEvent(req, res) {
  const eventId = Number(req.params.eventId);
  if (isNaN(eventId)) {
    return res.status(400).json({ error: "invalid event id" });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return res.status(404).json({ error: "event not found" });
  }

  if (event.published) {
    return res.status(400).json({ error: "cannot delete published event" });
  }

  try {
    await prisma.event.delete({ where: { id: eventId } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error while deleting event" });
  }
}

/**
 * add organizer to event
 * payload:
 *  - utorid: string (utorid of organizer)
 */
async function addEventOrganizer(req, res) {
  const eventId = Number(req.params.eventId);
  if (isNaN(eventId)) {
    return res.status(400).json({ error: "invalid event id" });
  }
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventOrganizers: { include: { user: true } },
      eventGuests: true,
    },
  });
  if (!event) {
    return res.status(404).json({ error: "event not found" });
  }
  const now = new Date();
  if (now > event.endTime) {
    return res.status(410).json({ error: "event has ended" });
  }
  const { utorid } = req.body;
  if (!utorid) {
    return res.status(400).json({ error: "missing required field utorid" });
  }
  const userToAdd = await prisma.user.findUnique({ where: { utorid } });
  if (!userToAdd) {
    return res.status(404).json({ error: "user not found" });
  }
  const isGuest = event.eventGuests.some(
    (guest) => guest.userId === userToAdd.id
  );
  if (isGuest) {
    return res
      .status(400)
      .json({ error: "user is registered as guest; remove guest first" });
  }
  const alreadyOrganizer = event.eventOrganizers.some(
    (org) => org.user.id === userToAdd.id
  );
  if (alreadyOrganizer) {
    const organizers = event.eventOrganizers.map((org) => ({
      id: org.user.id,
      utorid: org.user.utorid,
      name: org.user.name,
    }));
    return res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      organizers,
    });
  }
  try {
    await prisma.eventOrganizer.create({
      data: {
        eventId: event.id,
        userId: userToAdd.id,
      },
    });
    const updatedEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: { eventOrganizers: { include: { user: true } } },
    });
    const organizers = updatedEvent.eventOrganizers.map((org) => ({
      id: org.user.id,
      utorid: org.user.utorid,
      name: org.user.name,
    }));
    return res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      organizers,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while adding organizer" });
  }
}

/**
 * remove organizer from event
 * no payload
 */
async function removeEventOrganizer(req, res) {
  const eventId = Number(req.params.eventId);
  const userId = Number(req.params.userId);
  if (isNaN(eventId) || isNaN(userId)) {
    return res.status(400).json({ error: "invalid event id or user id" });
  }
  try {
    const existing = await prisma.eventOrganizer.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });
    if (!existing) {
      return res.status(404).json({ error: "organizer not found for event" });
    }
    await prisma.eventOrganizer.delete({
      where: {
        eventId_userId: { eventId, userId },
      },
    });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "server error while removing organizer" });
  }
}

/**
 * add guest to event
 * payload:
 *  - utorid: string (utorid of guest)
 */
async function addEventGuest(req, res) {
  const eventId = Number(req.params.eventId);
  if (isNaN(eventId)) {
    return res.status(400).json({ error: "invalid event id" });
  }
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventOrganizers: { include: { user: true } },
      eventGuests: true,
    },
  });
  if (!event) {
    return res.status(404).json({ error: "event not found" });
  }
  const now = new Date();
  if (now > event.endTime) {
    return res.status(410).json({ error: "event has ended" });
  }
  if (event.capacity !== null && event.eventGuests.length >= event.capacity) {
    return res.status(410).json({ error: "event is full" });
  }

  const isCurrentOrganizer = event.eventOrganizers.some(
    (org) => org.user.id === req.user.id
  );
  if (
    roleHierarchy[req.user.role] < roleHierarchy.MANAGER &&
    !isCurrentOrganizer
  ) {
    if (!event.published) {
      return res.status(404).json({ error: "event not visible" });
    }
  }
  const { utorid } = req.body;
  if (!utorid) {
    return res.status(400).json({ error: "missing required field utorid" });
  }
  const guestUser = await prisma.user.findUnique({ where: { utorid } });
  if (!guestUser) {
    return res.status(404).json({ error: "user not found" });
  }
  const isOrganizer = event.eventOrganizers.some(
    (org) => org.user.id === guestUser.id
  );
  if (isOrganizer) {
    return res.status(400).json({
      error: "user is registered as organizer; remove organizer first",
    });
  }
  const alreadyGuest = event.eventGuests.some(
    (guest) => guest.userId === guestUser.id
  );
  if (alreadyGuest) {
    return res.status(400).json({ error: "user is already a guest" });
  }
  try {
    await prisma.eventGuest.create({
      data: {
        eventId: event.id,
        userId: guestUser.id,
      },
    });
    const updatedEvent = await prisma.event.findUnique({
      where: { id: event.id },
      include: { eventGuests: true },
    });
    return res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      guestAdded: {
        id: guestUser.id,
        utorid: guestUser.utorid,
        name: guestUser.name,
      },
      numGuests: updatedEvent.eventGuests.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error while adding guest" });
  }
}

/**
 * remove guest from event
 * no payload
 */
async function removeEventGuest(req, res) {
  const eventId = Number(req.params.eventId);
  const userId = Number(req.params.userId);
  if (isNaN(eventId) || isNaN(userId)) {
    return res.status(400).json({ error: "invalid event id or user id" });
  }

  if (roleHierarchy[req.user.role] < roleHierarchy.MANAGER) {
    return res.status(403).json({ error: "forbidden" });
  }
  try {
    const guest = await prisma.eventGuest.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!guest) {
      return res.status(404).json({ error: "guest not found in event" });
    }
    await prisma.eventGuest.delete({
      where: { eventId_userId: { eventId, userId } },
    });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error while removing guest" });
  }
}

/**
 * add logged in user as guest to event
 * no payload
 */
async function addMyGuest(req, res) {
  const eventId = Number(req.params.eventId);
  if (isNaN(eventId)) {
    return res.status(400).json({ error: "invalid event id" });
  }
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { eventGuests: true },
  });
  if (!event) {
    return res.status(404).json({ error: "event not found" });
  }
  const now = new Date();
  if (
    now > event.endTime ||
    (event.capacity !== null && event.eventGuests.length >= event.capacity)
  ) {
    return res.status(410).json({ error: "event is full or has ended" });
  }
  const alreadyGuest = await prisma.eventGuest.findUnique({
    where: { eventId_userId: { eventId, userId: req.user.id } },
  });
  if (alreadyGuest) {
    return res.status(400).json({ error: "user already on guest list" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  try {
    await prisma.eventGuest.create({
      data: { eventId: event.id, userId: req.user.id },
    });
    return res.status(201).json({
      id: event.id,
      name: event.name,
      location: event.location,
      guestAdded: {
        id: user.id,
        utorid: user.utorid,
        name: user.name,
      },
      numGuests: event.eventGuests.length + 1,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error while adding guest" });
  }
}


/**
 * remove logged in user from event
 * no payload
 */
async function removeMyGuest(req, res) {
  const eventId = Number(req.params.eventId);
  if (isNaN(eventId)) {
    return res.status(400).json({ error: "invalid event id" });
  }
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return res.status(404).json({ error: "event not found" });
  }
  const now = new Date();
  if (now > event.endTime) {
    return res.status(410).json({ error: "event has ended" });
  }
  try {
    const guest = await prisma.eventGuest.findUnique({
      where: { eventId_userId: { eventId, userId: req.user.id } },
    });
    if (!guest) {
      return res.status(404).json({ error: "user did not RSVP to this event" });
    }
    await prisma.eventGuest.delete({
      where: { eventId_userId: { eventId, userId: req.user.id } },
    });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "server error while removing guest" });
  }
}

/**
 * create event reward transaction
 * payload:
 *  - type: string (must be "event")
 *  - utorid: string (optional, guest to award; if omitted, award to all guests)
 *  - amount: number (points to award)
 *  - remark: string (optional)
 */
async function createEventTransaction(req, res) {
  const eventId = Number(req.params.eventId);
  if (isNaN(eventId)) {
    return res.status(400).json({ error: "invalid event id" });
  }
  const { type, utorid, amount, remark } = req.body;
  if (type !== "event") {
    return res.status(400).json({ error: "invalid transaction type" });
  }
  if (amount == null || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "invalid or missing amount" });
  }
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventGuests: true,
      eventOrganizers: { include: { user: true } },
    },
  });
  if (!event) {
    return res.status(404).json({ error: "event not found" });
  }

  const isOrganizer = event.eventOrganizers.some(
    (eo) => eo.user.id === req.user.id
  );
  if (roleHierarchy[req.user.role] < roleHierarchy.MANAGER && !isOrganizer) {
    return res.status(403).json({ error: "forbidden" });
  }
  // const now = new Date();
  // if (now < event.endTime) {
  //   return res
  //     .status(400)
  //     .json({ error: "cannot award points before event has ended" });
  // }
  const remainingPoints = event.totalPoints - event.pointsAwarded;
  if (utorid) {
    const guestUser = await prisma.user.findUnique({ where: { utorid } });
    if (!guestUser) {
      return res.status(404).json({ error: "guest user not found" });
    }
    const isGuest = event.eventGuests.some((eg) => eg.userId === guestUser.id);
    if (!isGuest) {
      return res.status(400).json({ error: "user is not on guest list" });
    }
    if (remainingPoints < amount) {
      return res.status(400).json({ error: "not enough remaining points" });
    }
    try {
      const tx = await prisma.transaction.create({
        data: {
          type: "EVENT",
          amount: amount,
          remark: remark || "",
          relatedId: event.id,
          user: { connect: { id: guestUser.id } },
          createdBy: { connect: { id: req.user.id } },
        },
      });
      await prisma.event.update({
        where: { id: event.id },
        data: { pointsAwarded: { increment: amount } },
      });
      await prisma.user.update({
        where: { id: guestUser.id },
        data: { points: { increment: amount } },
      });
      return res.status(201).json({
        id: tx.id,
        recipient: guestUser.utorid,
        awarded: amount,
        type: "event",
        relatedId: event.id,
        remark: tx.remark,
        createdBy: req.user.utorid,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "server error while creating transaction" });
    }
  } else {
    const guests = event.eventGuests;
    if (guests.length === 0) {
      return res.status(400).json({ error: "no guests to award" });
    }
    const totalRequired = amount * guests.length;
    if (remainingPoints < totalRequired) {
      return res.status(400).json({ error: "not enough remaining points" });
    }
    try {
      const transactions = [];
      let id = 0;
      for (const guest of guests) {
        await prisma.transaction.create({
          data: {
            type: "EVENT",
            amount: amount,
            remark: remark || "",
            relatedId: event.id,
            userId: guest.userId,
            createdById: req.user.id,
          },
        });
        await prisma.user.update({
          where: { id: guest.userId },
          data: { points: { increment: amount } },
        });

        const sampleGuest = await prisma.user.findUnique({
          where: { id: guests[0].userId },
        });

        const sampleTx = {
          id: id++,
          recipient: sampleGuest.utorid,
          awarded: amount,
          type: "event",
          relatedId: event.id,
          remark: remark || "",
          createdBy: req.user.utorid,
        };

        transactions.push(sampleTx);
      }

      await prisma.event.update({
        where: { id: event.id },
        data: { pointsAwarded: { increment: totalRequired } },
      });

      return res.status(201).json(transactions);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "server error while awarding points to all guests" });
    }
  }
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  addEventOrganizer,
  removeEventOrganizer,
  addEventGuest,
  removeEventGuest,
  addMyGuest,
  removeMyGuest,
  createEventTransaction,
};
