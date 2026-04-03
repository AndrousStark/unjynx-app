package com.metaminds.unjynx.wear.ui.screens

import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import kotlinx.coroutines.delay

private val UnjynxGold = Color(0xFFFFD700)
private val UnjynxEmerald = Color(0xFF10B981)
private val UnjynxDeepPurple = Color(0xFF1A0533)
private val UnjynxMidnight = Color(0xFF0F0A1A)

@Composable
fun PomodoroScreen() {
    val context = LocalContext.current
    val vibrator = remember { context.getSystemService(Vibrator::class.java) }

    var remainingSeconds by remember { mutableIntStateOf(25 * 60) }
    var isRunning by remember { mutableStateOf(false) }
    var isBreak by remember { mutableStateOf(false) }
    var completedSessions by remember { mutableIntStateOf(0) }

    val workDuration = 25 * 60
    val shortBreakDuration = 5 * 60
    val longBreakDuration = 15 * 60

    val totalDuration = if (isBreak) {
        if (completedSessions % 4 == 0) longBreakDuration else shortBreakDuration
    } else workDuration

    val progress = (totalDuration - remainingSeconds).toFloat() / totalDuration.toFloat()
    val minutes = remainingSeconds / 60
    val seconds = remainingSeconds % 60
    val timeText = "%02d:%02d".format(minutes, seconds)
    val phaseText = if (isBreak) {
        if (completedSessions % 4 == 0) "Long Break" else "Short Break"
    } else "Focus ${completedSessions + 1}/4"

    val ringColor = if (isBreak) UnjynxEmerald else UnjynxGold

    // Timer tick
    LaunchedEffect(isRunning) {
        while (isRunning) {
            delay(1000)
            if (remainingSeconds > 0) {
                remainingSeconds--
            } else {
                // Session complete — vibrate
                vibrator?.vibrate(VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE))
                isRunning = false
                if (isBreak) {
                    isBreak = false
                    remainingSeconds = workDuration
                } else {
                    completedSessions++
                    isBreak = true
                    remainingSeconds = if (completedSessions % 4 == 0) longBreakDuration else shortBreakDuration
                }
            }
        }
    }

    Scaffold(
        timeText = { TimeText() },
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // Timer ring
            Box(contentAlignment = Alignment.Center) {
                Canvas(modifier = Modifier.size(100.dp)) {
                    val strokeWidth = 8.dp.toPx()
                    val arcSize = Size(size.width - strokeWidth, size.height - strokeWidth)
                    val topLeft = Offset(strokeWidth / 2, strokeWidth / 2)

                    // Background ring
                    drawArc(
                        color = UnjynxDeepPurple,
                        startAngle = -90f,
                        sweepAngle = 360f,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                    )

                    // Progress ring
                    drawArc(
                        color = ringColor,
                        startAngle = -90f,
                        sweepAngle = progress * 360f,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = timeText,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                    )
                    Text(
                        text = phaseText,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium,
                        color = ringColor,
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Session dots
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                repeat(4) { i ->
                    Canvas(modifier = Modifier.size(6.dp)) {
                        drawCircle(
                            color = if (i < completedSessions) UnjynxGold else UnjynxDeepPurple,
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Play/Pause button
            CompactChip(
                onClick = { isRunning = !isRunning },
                label = {
                    Text(
                        text = if (isRunning) "Pause" else "Start",
                        textAlign = TextAlign.Center,
                    )
                },
                colors = ChipDefaults.chipColors(
                    backgroundColor = ringColor.copy(alpha = 0.2f),
                    contentColor = ringColor,
                ),
            )
        }
    }
}
