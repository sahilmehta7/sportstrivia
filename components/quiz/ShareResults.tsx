"use client";

import { useState } from "react";

interface ShareResultsProps {
  quizTitle: string;
  userName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  totalPoints: number;
  timeSpent: number;
}

export function useShareResults({
  quizTitle,
  userName,
  score,
  correctAnswers,
  totalQuestions,
  totalPoints,
  timeSpent
}: ShareResultsProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "0 sec";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };

  const generateShareImage = async () => {
    setIsGenerating(true);
    
    try {
      // Create canvas for image generation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas dimensions (Instagram story size)
      canvas.width = 1080;
      canvas.height = 1920;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(0.5, '#7c3aed');
      gradient.addColorStop(1, '#f59e0b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add some blur circles for glassmorphism effect
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(200, 300, 150, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(800, 400, 120, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(900, 1500, 100, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.globalAlpha = 1;

      // Main container with glassmorphism effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(100, 200, 880, 1520);
      
      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, 200, 880, 1520);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Quiz Results', canvas.width / 2, 350);

      // Quiz name
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '32px Arial';
      ctx.fillText(quizTitle, canvas.width / 2, 420);

      // Score circle
      const centerX = canvas.width / 2;
      const centerY = 600;
      const radius = 120;
      
      // Circle background
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Circle border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Score text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 48px Arial';
      ctx.fillText(score.toFixed(1) + '%', centerX, centerY + 15);

      // Correct answers
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText(`${correctAnswers}/${totalQuestions}`, centerX, centerY + 50);

      // Stats section
      const statsY = 800;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Performance Stats', 200, statsY);

      // Points
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`${totalPoints} Points`, 200, statsY + 60);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '24px Arial';
      ctx.fillText('Total Points Earned', 200, statsY + 90);

      // Time
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(formatTime(timeSpent), 200, statsY + 150);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '24px Arial';
      ctx.fillText('Time Taken', 200, statsY + 180);

      // Challenge message
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Can you beat this score?', canvas.width / 2, 1200);

      // Player name
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`- ${userName}`, canvas.width / 2, 1250);

      // App branding
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '20px Arial';
      ctx.fillText('Take the quiz at Sportstrivia', canvas.width / 2, 1400);

      // Convert canvas to blob
      return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          }
        }, 'image/jpeg', 0.9);
      });

    } catch (error) {
      console.error('Error generating share image:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };


  const shareResults = async () => {
    try {
      const blob = await generateShareImage();
      const url = URL.createObjectURL(blob);
      
      // Create WhatsApp message
      const message = `🎯 I just scored ${score.toFixed(1)}% on "${quizTitle}"! 

📊 My stats:
• ${correctAnswers}/${totalQuestions} correct answers
• ${totalPoints} points earned
• Completed in ${formatTime(timeSpent)}

Think you can beat my score? Take the quiz and challenge me! 🏆

#QuizChallenge #Sportstrivia`;

      // Create a temporary link to share the image
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp with message
      window.open(shareUrl, '_blank');
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error sharing results:', error);
    }
  };

  return {
    shareResults,
    isGenerating
  };
}
