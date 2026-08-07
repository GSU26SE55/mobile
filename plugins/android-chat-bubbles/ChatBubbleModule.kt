package __ANDROID_PACKAGE__.notifications

import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ChatBubbleModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "LocalNotifications"

  @ReactMethod
  fun ensureChannels(promise: Promise) {
    try {
      ChatBubbleNotifier.ensureChannels(reactApplicationContext)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("LOCAL_NOTIFICATION_CHANNEL", error)
    }
  }

  @ReactMethod
  fun areEnabled(promise: Promise) {
    promise.resolve(NotificationManagerCompat.from(reactApplicationContext).areNotificationsEnabled())
  }

  @ReactMethod
  fun openSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
        putExtra(Settings.EXTRA_APP_PACKAGE, reactApplicationContext.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("LOCAL_NOTIFICATION_SETTINGS", error)
    }
  }

  @ReactMethod
  fun presentNotification(
    notificationId: String,
    title: String,
    message: String,
    entityType: String?,
    entityId: String?,
    ticketId: String?,
    critical: Boolean,
    promise: Promise,
  ) {
    try {
      promise.resolve(
        ChatBubbleNotifier.presentNotification(
          reactApplicationContext,
          notificationId,
          title,
          message,
          entityType,
          entityId,
          ticketId,
          critical,
        ),
      )
    } catch (error: Exception) {
      promise.reject("LOCAL_NOTIFICATION_PRESENT", error)
    }
  }

  @ReactMethod
  fun presentChatBubble(
    notificationId: String,
    ticketId: String,
    title: String,
    message: String,
    senderName: String,
    promise: Promise,
  ) {
    try {
      promise.resolve(
        ChatBubbleNotifier.presentBubble(
          reactApplicationContext,
          notificationId,
          ticketId,
          title,
          message,
          senderName,
        ),
      )
    } catch (error: Exception) {
      promise.reject("CHAT_BUBBLE_PRESENT", error)
    }
  }
}
