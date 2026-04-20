const functions = require('firebase-functions/v1')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

exports.onMessageCreated = functions.firestore
  .document('events/{eventCode}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data()
    const { body, target, kind, sentBy } = message
    if (!target || !body) return null

    const eventCode = context.params.eventCode
    const tokensSnap = await db.collection(`events/${eventCode}/fcmTokens`).get()
    if (tokensSnap.empty) return null

    const groups = target.groups || []
    const rosterIds = target.rosterIds || []

    const matchingTokens = []
    tokensSnap.forEach((doc) => {
      const data = doc.data()
      const { rosterId, role, token } = data
      if (!token) return

      let match = false
      if (groups.includes('all')) match = true
      if (groups.includes('students') && role === 'student') match = true
      if (groups.includes('mentors') && role === 'mentor') match = true
      if (rosterIds.includes(rosterId)) match = true

      if (match) matchingTokens.push(token)
    })

    if (matchingTokens.length === 0) return null

    const title = kind === 'checkin' ? '🔴 Check In — Venom Locate' : '📢 Venom Locate'

    // DATA-ONLY message: SW will manually display via showNotification.
    // Avoids cross-browser inconsistencies with the `notification` field.
    const fcmPayload = {
      data: {
        title,
        body,
        kind: kind || 'info',
        sentBy: sentBy || 'Admin',
        messageId: context.params.messageId,
      },
      webpush: {
        headers: { Urgency: 'high', TTL: '60' },
        fcmOptions: { link: '/' },
      },
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' } },
    }

    const batchSize = 500
    for (let i = 0; i < matchingTokens.length; i += batchSize) {
      const batch = matchingTokens.slice(i, i + batchSize)
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        ...fcmPayload,
      })

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(`Token ${idx} failed:`, resp.error?.code, resp.error?.message)
        }
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          const staleToken = batch[idx]
          tokensSnap.forEach((doc) => {
            if (doc.data().token === staleToken) doc.ref.delete()
          })
        }
      })
    }

    console.log(`FCM sent to ${matchingTokens.length} devices for message ${context.params.messageId}`)
    return null
  })
