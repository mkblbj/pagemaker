'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type LoginSceneState = 'idle' | 'email-focus' | 'password-focus' | 'password-visible'

interface LoginCharacterSceneProps {
  sceneState: LoginSceneState
  className?: string
}

interface Offset {
  x: number
  y: number
}

interface EyeBallProps {
  size: number
  pupilSize: number
  offset: Offset
  isBlinking?: boolean
  eyeColor?: string
  pupilColor?: string
}

interface PupilProps {
  size: number
  offset: Offset
  pupilColor?: string
}

const STAGE_SIZE = {
  width: 550,
  height: 400
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function useBlinking() {
  const [isBlinking, setIsBlinking] = useState(false)

  useEffect(() => {
    let blinkTimer: number | undefined
    let resetTimer: number | undefined
    let isActive = true

    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(
        () => {
          if (!isActive) return
          setIsBlinking(true)

          resetTimer = window.setTimeout(() => {
            if (!isActive) return
            setIsBlinking(false)
            scheduleBlink()
          }, 160)
        },
        2800 + Math.random() * 3200
      )
    }

    scheduleBlink()

    return () => {
      isActive = false
      if (blinkTimer) window.clearTimeout(blinkTimer)
      if (resetTimer) window.clearTimeout(resetTimer)
    }
  }, [])

  return isBlinking
}

function usePurplePeek(enabled: boolean) {
  const [isPeeking, setIsPeeking] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setIsPeeking(false)
      return
    }

    let peekTimer: number | undefined
    let resetTimer: number | undefined
    let isActive = true

    const schedulePeek = () => {
      peekTimer = window.setTimeout(
        () => {
          if (!isActive) return
          setIsPeeking(true)

          resetTimer = window.setTimeout(() => {
            if (!isActive) return
            setIsPeeking(false)
            schedulePeek()
          }, 700)
        },
        2200 + Math.random() * 2200
      )
    }

    schedulePeek()

    return () => {
      isActive = false
      if (peekTimer) window.clearTimeout(peekTimer)
      if (resetTimer) window.clearTimeout(resetTimer)
    }
  }, [enabled])

  return isPeeking
}

function EyeBall({
  size,
  pupilSize,
  offset,
  isBlinking = false,
  eyeColor = 'white',
  pupilColor = '#2d2d2d'
}: EyeBallProps) {
  return (
    <div
      className="rounded-full transition-all duration-150 ease-out"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden'
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            margin: 'auto',
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: 'transform 120ms ease-out'
          }}
        />
      )}
    </div>
  )
}

function Pupil({ size, offset, pupilColor = '#2d2d2d' }: PupilProps) {
  return (
    <div
      className="rounded-full transition-transform duration-150 ease-out"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${offset.x}px, ${offset.y}px)`
      }}
    />
  )
}

export function LoginCharacterScene({ sceneState, className }: LoginCharacterSceneProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({
    x: STAGE_SIZE.width / 2,
    y: STAGE_SIZE.height / 2
  })
  const isPurpleBlinking = useBlinking()
  const isBlackBlinking = useBlinking()

  const isEmailFocus = sceneState === 'email-focus'
  const isPasswordFocus = sceneState === 'password-focus'
  const isPasswordVisible = sceneState === 'password-visible'
  const isPurplePeeking = usePurplePeek(isPasswordVisible)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!stageRef.current) return

      const rect = stageRef.current.getBoundingClientRect()

      setMousePosition({
        x: clamp(event.clientX - rect.left, -120, rect.width + 120),
        y: clamp(event.clientY - rect.top, -120, rect.height + 120)
      })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const calculateMotion = (centerX: number, centerY: number) => {
    const deltaX = mousePosition.x - centerX
    const deltaY = mousePosition.y - centerY

    return {
      faceX: clamp(deltaX / 20, -15, 15),
      faceY: clamp(deltaY / 30, -10, 10),
      bodySkew: clamp(-deltaX / 120, -6, 6)
    }
  }

  const calculateEyeOffset = (
    centerX: number,
    centerY: number,
    maxDistance: number,
    forced?: Offset
  ): Offset => {
    if (forced) {
      return forced
    }

    const deltaX = mousePosition.x - centerX
    const deltaY = mousePosition.y - centerY
    const angle = Math.atan2(deltaY, deltaX)
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance)

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    }
  }

  const purpleMotion = calculateMotion(160, 118)
  const blackMotion = calculateMotion(300, 135)
  const orangeMotion = calculateMotion(120, 275)
  const yellowMotion = calculateMotion(380, 235)

  const purpleLook = isPasswordVisible
    ? isPurplePeeking
      ? { x: 4, y: 5 }
      : { x: -4, y: -4 }
    : isEmailFocus
      ? { x: 3, y: 4 }
      : undefined

  const blackLook = isPasswordVisible
    ? { x: -4, y: -4 }
    : isEmailFocus
      ? { x: 0, y: -4 }
      : undefined

  const orangeLook = isPasswordVisible ? { x: -5, y: -4 } : undefined
  const yellowLook = isPasswordVisible ? { x: -5, y: -4 } : undefined

  const purpleEyeOffset = calculateEyeOffset(124, 84, 5, purpleLook)
  const blackEyeOffset = calculateEyeOffset(284, 92, 4, blackLook)
  const orangeEyeOffset = calculateEyeOffset(112, 290, 5, orangeLook)
  const yellowEyeOffset = calculateEyeOffset(368, 235, 5, yellowLook)

  const purpleTransform = isPasswordVisible
    ? 'skewX(0deg)'
    : isEmailFocus
      ? `skewX(${purpleMotion.bodySkew - 12}deg) translateX(40px)`
      : isPasswordFocus
        ? `skewX(${purpleMotion.bodySkew - 7}deg) translateX(18px)`
        : `skewX(${purpleMotion.bodySkew}deg)`

  const blackTransform = isPasswordVisible
    ? 'skewX(0deg)'
    : isEmailFocus
      ? `skewX(${blackMotion.bodySkew * 1.4 + 10}deg) translateX(20px)`
      : isPasswordFocus
        ? `skewX(${blackMotion.bodySkew * 1.2}deg)`
        : `skewX(${blackMotion.bodySkew}deg)`

  return (
    <div
      ref={stageRef}
      data-testid="login-character-scene"
      data-scene-state={sceneState}
      data-password-visible={isPasswordVisible ? 'true' : 'false'}
      className={cn('relative h-[400px] w-full max-w-[550px]', className)}
    >
      <div
        className="absolute bottom-0 left-[70px] z-[1] transition-all duration-700 ease-in-out"
        style={{
          width: '180px',
          height: isEmailFocus ? '440px' : isPasswordFocus ? '420px' : '400px',
          backgroundColor: '#6c3ff5',
          borderRadius: '10px 10px 0 0',
          transform: purpleTransform,
          transformOrigin: 'bottom center'
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          style={{
            left: isPasswordVisible ? '20px' : isEmailFocus ? '55px' : `${45 + purpleMotion.faceX}px`,
            top: isPasswordVisible ? '35px' : isEmailFocus ? '65px' : `${40 + purpleMotion.faceY}px`
          }}
        >
          <EyeBall size={18} pupilSize={7} offset={purpleEyeOffset} isBlinking={isPurpleBlinking} />
          <EyeBall size={18} pupilSize={7} offset={purpleEyeOffset} isBlinking={isPurpleBlinking} />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-[240px] z-[2] transition-all duration-700 ease-in-out"
        style={{
          width: '120px',
          height: '310px',
          backgroundColor: '#2d2d2d',
          borderRadius: '8px 8px 0 0',
          transform: blackTransform,
          transformOrigin: 'bottom center'
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          style={{
            left: isPasswordVisible ? '10px' : isEmailFocus ? '32px' : `${26 + blackMotion.faceX}px`,
            top: isPasswordVisible ? '28px' : isEmailFocus ? '12px' : `${32 + blackMotion.faceY}px`
          }}
        >
          <EyeBall size={16} pupilSize={6} offset={blackEyeOffset} isBlinking={isBlackBlinking} />
          <EyeBall size={16} pupilSize={6} offset={blackEyeOffset} isBlinking={isBlackBlinking} />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 z-[3] transition-all duration-700 ease-in-out"
        style={{
          width: '240px',
          height: '200px',
          backgroundColor: '#ff9b6b',
          borderRadius: '120px 120px 0 0',
          transform: isPasswordVisible ? 'skewX(0deg)' : `skewX(${orangeMotion.bodySkew}deg)`,
          transformOrigin: 'bottom center'
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{
            left: isPasswordVisible ? '50px' : `${82 + orangeMotion.faceX}px`,
            top: isPasswordVisible ? '85px' : `${90 + orangeMotion.faceY}px`
          }}
        >
          <Pupil size={12} offset={orangeEyeOffset} />
          <Pupil size={12} offset={orangeEyeOffset} />
        </div>
      </div>

      <div
        className="absolute bottom-0 left-[310px] z-[4] transition-all duration-700 ease-in-out"
        style={{
          width: '140px',
          height: '230px',
          backgroundColor: '#e8d754',
          borderRadius: '70px 70px 0 0',
          transform: isPasswordVisible ? 'skewX(0deg)' : `skewX(${yellowMotion.bodySkew}deg)`,
          transformOrigin: 'bottom center'
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{
            left: isPasswordVisible ? '20px' : `${52 + yellowMotion.faceX}px`,
            top: isPasswordVisible ? '35px' : `${40 + yellowMotion.faceY}px`
          }}
        >
          <Pupil size={12} offset={yellowEyeOffset} />
          <Pupil size={12} offset={yellowEyeOffset} />
        </div>

        <div
          className="absolute h-[4px] w-20 rounded-full bg-[#2d2d2d] transition-all duration-200 ease-out"
          style={{
            left: isPasswordVisible ? '10px' : `${40 + yellowMotion.faceX}px`,
            top: isPasswordVisible ? '88px' : `${88 + yellowMotion.faceY}px`
          }}
        />
      </div>
    </div>
  )
}
