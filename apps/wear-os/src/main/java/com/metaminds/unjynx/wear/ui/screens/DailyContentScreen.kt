package com.metaminds.unjynx.wear.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.metaminds.unjynx.wear.data.ApiClient
import kotlinx.coroutines.launch

private val UnjynxGold = Color(0xFFFFD700)
private val UnjynxLavender = Color(0xFFA78BFA)
private val UnjynxMuted = Color(0xFF9CA3AF)

@Composable
fun DailyContentScreen() {
    val scope = rememberCoroutineScope()
    var content by remember { mutableStateOf<String?>(null) }
    var author by remember { mutableStateOf<String?>(null) }
    var category by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val data = ApiClient.get("/api/v1/content/today")
                val payload = data?.get("data") as? Map<*, *>
                content = payload?.get("content") as? String
                author = payload?.get("author") as? String
                category = payload?.get("category") as? String
            } catch (_: Exception) {
                // Graceful fallback
            }
            isLoading = false
        }
    }

    Scaffold(
        timeText = { TimeText() },
    ) {
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // Category
            item {
                category?.let {
                    Text(
                        text = it.uppercase(),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = UnjynxGold,
                        letterSpacing = 1.2.sp,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }

            // Quote
            item {
                if (isLoading) {
                    CircularProgressIndicator(
                        indicatorColor = UnjynxGold,
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp,
                    )
                } else if (content != null) {
                    Text(
                        text = "\u201C${content}\u201D",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        fontStyle = FontStyle.Italic,
                        color = Color.White,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp,
                        modifier = Modifier.padding(horizontal = 8.dp),
                    )
                } else {
                    Text(
                        text = "No content today",
                        fontSize = 12.sp,
                        color = UnjynxMuted,
                    )
                }
            }

            // Author
            item {
                author?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "— $it",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = UnjynxLavender,
                    )
                }
            }
        }
    }
}
