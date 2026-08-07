package __ANDROID_PACKAGE__.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import androidx.core.content.LocusIdCompat
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import __ANDROID_PACKAGE__.MainActivity
import __ANDROID_PACKAGE__.R
import org.json.JSONArray
import org.json.JSONObject

internal data class StoredBubbleMessage(
  val notificationId: String,
  val title: String,
  val senderName: String,
  val message: String,
  val timestamp: Long,
  val isOwn: Boolean = false,
)

internal object ChatBubbleNotifier {
  private const val DEFAULT_CHANNEL_ID = "alerts-default"
  private const val CRITICAL_CHANNEL_ID = "alerts-critical"
  private const val CHAT_CHANNEL_ID = "chat-messages"
  private const val HISTORY_PREFERENCES = "sonari-chat-bubbles"
  private const val HISTORY_LIMIT = 30

  const val ACTION_CHAT_UPDATED = "__ANDROID_PACKAGE__.notifications.CHAT_UPDATED"
  const val EXTRA_NOTIFICATION_ID = "notificationId"
  const val EXTRA_TICKET_ID = "ticketId"
  const val EXTRA_TITLE = "title"
  const val EXTRA_MESSAGE = "message"
  const val EXTRA_SENDER_NAME = "senderName"

  fun ensureChannels(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(
      NotificationChannel(DEFAULT_CHANNEL_ID, "Thông báo", NotificationManager.IMPORTANCE_DEFAULT).apply {
        description = "Cập nhật ticket, phân công và trạng thái thiết bị"
        enableVibration(true)
        setShowBadge(true)
      },
    )
    manager.createNotificationChannel(
      NotificationChannel(CRITICAL_CHANNEL_ID, "Cảnh báo khẩn cấp", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Sự cố môi trường, pin nguy hiểm và SLA"
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 400, 200, 400)
        setShowBadge(true)
      },
    )
    manager.createNotificationChannel(
      NotificationChannel(CHAT_CHANNEL_ID, "Tin nhắn", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Tin nhắn và trao đổi mới trên ticket"
        enableVibration(true)
        setShowBadge(true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) setAllowBubbles(true)
      },
    )
  }

  fun presentNotification(
    context: Context,
    notificationId: String,
    title: String,
    message: String,
    entityType: String?,
    entityId: String?,
    ticketId: String?,
    critical: Boolean,
  ): Boolean {
    ensureChannels(context)
    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) return false

    val deepLink = Uri.parse("sonari:///notification/open").buildUpon()
      .appendQueryParameter("notificationId", notificationId)
      .appendQueryParameter("entityType", entityType)
      .appendQueryParameter("entityId", entityId)
      .appendQueryParameter("ticketId", ticketId)
      .build()
    val openIntent = Intent(Intent.ACTION_VIEW, deepLink, context, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
    val contentIntent = PendingIntent.getActivity(
      context,
      notificationId.hashCode() and 0x7fffffff,
      openIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val channelId = if (critical) CRITICAL_CHANNEL_ID else DEFAULT_CHANNEL_ID
    val notification = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(message)
      .setStyle(NotificationCompat.BigTextStyle().bigText(message))
      .setCategory(if (critical) NotificationCompat.CATEGORY_ALARM else NotificationCompat.CATEGORY_STATUS)
      .setPriority(if (critical) NotificationCompat.PRIORITY_MAX else NotificationCompat.PRIORITY_DEFAULT)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(true)
      .setContentIntent(contentIntent)
      .build()

    manager.notify("notification:$notificationId", notificationId.hashCode(), notification)
    return true
  }

  fun presentBubble(
    context: Context,
    notificationId: String,
    ticketId: String,
    title: String,
    message: String,
    senderName: String,
  ): Boolean {
    ensureChannels(context)
    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) return false

    saveMessage(context, ticketId, notificationId, title, senderName, message, false)

    val shortcutId = "ticket-$ticketId"
    val requestCode = shortcutId.hashCode() and 0x7fffffff
    val deepLink = chatDeepLink(ticketId, notificationId)
    val openAppIntent = Intent(Intent.ACTION_VIEW, deepLink, context, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
    val contentIntent = PendingIntent.getActivity(
      context,
      requestCode,
      openAppIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val bubbleIntent = Intent(Intent.ACTION_VIEW, deepLink, context, ChatBubbleActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_DOCUMENT or Intent.FLAG_ACTIVITY_MULTIPLE_TASK)
      putExtra(EXTRA_NOTIFICATION_ID, notificationId)
      putExtra(EXTRA_TICKET_ID, ticketId)
      putExtra(EXTRA_TITLE, title)
      putExtra(EXTRA_MESSAGE, message)
      putExtra(EXTRA_SENDER_NAME, senderName)
    }
    val bubblePendingIntent = PendingIntent.getActivity(
      context,
      requestCode + 1,
      bubbleIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE,
    )

    val sender = Person.Builder().setName(senderName).setImportant(true).build()
    val currentUser = Person.Builder().setName("Bạn").build()
    val icon = IconCompat.createWithResource(context, R.mipmap.ic_launcher)
    val shortcut = ShortcutInfoCompat.Builder(context, shortcutId)
      .setShortLabel(title.take(40))
      .setLongLived(true)
      .setIcon(icon)
      .setIntent(openAppIntent)
      .setPerson(sender)
      .build()
    ShortcutManagerCompat.pushDynamicShortcut(context, shortcut)

    val bubble = NotificationCompat.BubbleMetadata.Builder(bubblePendingIntent, icon)
      .setDesiredHeight(640)
      .setAutoExpandBubble(false)
      .setSuppressNotification(false)
      .build()
    val style = NotificationCompat.MessagingStyle(currentUser).setConversationTitle(title)
    getHistory(context, ticketId).forEach { chat ->
      style.addMessage(
        chat.message,
        chat.timestamp,
        Person.Builder().setName(chat.senderName).setImportant(true).build(),
      )
    }
    val notification = NotificationCompat.Builder(context, CHAT_CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(title)
      .setContentText(message)
      .setCategory(NotificationCompat.CATEGORY_MESSAGE)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setAutoCancel(true)
      .setContentIntent(contentIntent)
      .setStyle(style)
      .setShortcutInfo(shortcut)
      .setLocusId(LocusIdCompat(shortcutId))
      .setBubbleMetadata(bubble)
      .build()

    manager.notify("chat:$ticketId", requestCode, notification)
    context.sendBroadcast(
      Intent(ACTION_CHAT_UPDATED)
        .setPackage(context.packageName)
        .putExtra(EXTRA_TICKET_ID, ticketId),
    )
    return true
  }

  fun chatDeepLink(ticketId: String, notificationId: String): Uri =
    Uri.parse("sonari:///notification/chat").buildUpon()
      .appendQueryParameter("ticketId", ticketId)
      .appendQueryParameter("notificationId", notificationId)
      .build()

  @Synchronized
  fun saveMessage(
    context: Context,
    ticketId: String,
    notificationId: String,
    title: String,
    senderName: String,
    message: String,
    isOwn: Boolean,
  ) {
    val preferences = context.getSharedPreferences(HISTORY_PREFERENCES, Context.MODE_PRIVATE)
    val existing = runCatching {
      JSONArray(preferences.getString(historyKey(ticketId), "[]"))
    }.getOrDefault(JSONArray())
    val updated = JSONArray()
    for (index in 0 until existing.length()) {
      val item = existing.optJSONObject(index) ?: continue
      if (item.optString(EXTRA_NOTIFICATION_ID) != notificationId) updated.put(item)
    }
    updated.put(
      JSONObject()
        .put(EXTRA_NOTIFICATION_ID, notificationId)
        .put(EXTRA_TITLE, title)
        .put(EXTRA_SENDER_NAME, senderName)
        .put(EXTRA_MESSAGE, message)
        .put("timestamp", System.currentTimeMillis())
        .put("isOwn", isOwn),
    )
    while (updated.length() > HISTORY_LIMIT) updated.remove(0)
    preferences.edit().putString(historyKey(ticketId), updated.toString()).apply()
  }

  fun getHistory(context: Context, ticketId: String): List<StoredBubbleMessage> {
    if (ticketId.isBlank()) return emptyList()
    val preferences = context.getSharedPreferences(HISTORY_PREFERENCES, Context.MODE_PRIVATE)
    val values = runCatching {
      JSONArray(preferences.getString(historyKey(ticketId), "[]"))
    }.getOrDefault(JSONArray())
    return buildList {
      for (index in 0 until values.length()) {
        val item = values.optJSONObject(index) ?: continue
        add(
          StoredBubbleMessage(
            notificationId = item.optString(EXTRA_NOTIFICATION_ID),
            title = item.optString(EXTRA_TITLE),
            senderName = item.optString(EXTRA_SENDER_NAME, "Tin nhắn mới"),
            message = item.optString(EXTRA_MESSAGE),
            timestamp = item.optLong("timestamp", System.currentTimeMillis()),
            isOwn = item.optBoolean("isOwn", false),
          ),
        )
      }
    }
  }

  private fun historyKey(ticketId: String) = "history:$ticketId"
}
