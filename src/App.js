import React, { useState, useRef, useEffect } from 'react'
import { useSpring, useSprings, animated, to as interpolate } from '@react-spring/web'
import { useDrag, useGesture, useHover, useMove } from '@use-gesture/react'

import styles from './styles.module.css'

const cards = [
  '/images/handsome.jpeg',
  '/images/overestimate.jpeg',
  '/images/peace.jpeg',
  '/images/sakura.jpeg'
]

const captions = [
  '以为自己很帅',
  '以为自己很高',
  'Two stooges',
  '1 hour effort'
]

// const cards = [
//   'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
//   'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg',
//   'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
//   'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg',
//   'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/690px-RWS_Tarot_02_High_Priestess.jpg',
//   'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
// ]

// const captions = [
//   'This is caption F',
//   'This is caption E',
//   'This is caption D',
//   'This is caption C',
//   'This is caption B',
//   'This is caption A',
// ]

const calcX = (y, ly) => -(y - ly - window.innerHeight / 2) / 40
const calcY = (x, lx) => (x - lx - window.innerWidth / 2) / 40

// These two are just helpers, they curate spring data, values that are later being interpolated into css
const to = (i) => {
  const rot = Math.random()
  return {
  x: 0,
  y: i * -4,
  scale: 1,
  rotY: -10 + rot * 20,
  rotZ: -10 + rot * 20,
  rotX: 0,
  delay: i * 100,
}}
const from = (_i) => ({ x: 0, rotY: 0, rotZ: 0, rotX: 0, scale: 1.5, y: -1000 })
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (rx, ry, rz, s) =>
  `perspective(1500px) rotateX(${rx}deg) rotateY(${ry / 10}deg) rotateZ(${rz}deg) scale(${s})`

function Deck() {
  const [gone] = useState(() => new Set()) // The set flags all the cards that are flicked out
  const [props, api] = useSprings(cards.length, i => ({
    ...to(i),
    from: from(i),
  })) // Create a bunch of springs using the helpers above
  // Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity

  const gesture = useGesture({
    onDrag: ({ args: [index], down, movement: [mx], direction: [xDir], velocity: [velocityx, ] }) => {
      const trigger = Math.abs(velocityx) > 0.5 // If you flick hard enough it should trigger the card to fly out
      const dir = xDir < 0 ? -1 : 1 // Direction should either point left or right
      if (!down && trigger) gone.add(index) // If button/finger's up and trigger velocity is reached, we flag the card ready to fly out
      api.start(i => {
        if (index !== i) return // We're only interested in changing spring-data for the current spring
        const isGone = gone.has(index)
        const x = isGone ? (200 + window.innerWidth) * dir : down ? mx : 0 // When a card is gone it flys out left or right, otherwise goes back to zero
        const rot = mx / 100 + (isGone ? dir * 10 * velocityx : 0) // How much the card tilts, flicking it harder makes it rotate faster
        const scale = down ? 1.2 : 1 // Active cards lift up a bit
        return {
          x,
          rotY: rot,
          rotZ: rot,
          rotX: 0,
          scale,
          delay: undefined,
          config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 },
        }
      })
      if (!down && gone.size === cards.length)
        setTimeout(() => {
          gone.clear()
          api.start(i => to(i))
        }, 600)
    },
    onHover: ({ args: [index], dragging, hovering }) => {
      if (!hovering) {
        api.start(i => {
          if (index !== i) return;
          return {
            rotX: 0,
            rotY: 0,
            scale: 1,
          }
        })
      }
    },
    onMove: ({ args: [index], xy: [px, py], down, dragging, hovering }) => {
      if (!dragging) {
        api.start(i => {
          if (index !== i) return;
          return {
            rotX: calcX(py, 0),
            rotY: calcY(px, 0) * 10,
            rotZ: 0,
            scale: 1.3,
          }
        })
      }
    }
  })

  // Now we're just mapping the animated values to our view, that's it. Btw, this component only renders once. :-)
  return (
    <>
      {props.map(({ x, y, rotY, rotZ, rotX, scale }, i) => (
        <animated.div className={styles.deck} key={i} style={{ x, y }}>
          {/* This is the card itself, we're binding our gesture to it (and inject its index so we know which is which) */}
          <animated.div
            {...gesture(i)}
            className={styles.polaroid}
            style={{
              transform: interpolate([rotX, rotY, rotZ, scale], trans),
              // backgroundImage: `url(${cards[i]})`,
            }}
          >
            <img alt='hi' src={cards[i]} />
            <div className={styles.caption}>
              {captions[i]}
            </div>
          </animated.div>
        </animated.div>
      ))}
    </>
  )
}

export default function App() {
  return (
    <div className={styles.container}>
      <Deck />
    </div>
  )
}
