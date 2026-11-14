import {
  Sprout, Footprints, Sun, Flame, Dumbbell, Feather, Armchair, Flower2, Laptop, PartyPopper, Sunrise, House, Music,
  Target, Moon, Mountain, Trophy, Medal, Timer, Crown, Activity, Leaf, TreePine, Smile, ThumbsUp, Wind,
} from 'lucide-react'

// One icon set for the whole app, so nothing depends on how a phone draws emoji.
const MAP = {
  sprout: Sprout, footprints: Footprints, sun: Sun, flame: Flame, dumbbell: Dumbbell, feather: Feather, armchair: Armchair,
  flower: Flower2, laptop: Laptop, party: PartyPopper, sunrise: Sunrise, home: House, music: Music, target: Target, moon: Moon,
  mountain: Mountain, trophy: Trophy, medal: Medal, timer: Timer, crown: Crown, activity: Activity, leaf: Leaf, tree: TreePine,
  smile: Smile, thumb: ThumbsUp, wind: Wind,
}

export default function Glyph({ id, size = 22, ...rest }) {
  const Icon = MAP[id] || Activity
  return <Icon size={size} strokeWidth={size > 60 ? 1.2 : 2} aria-hidden="true" {...rest} />
}
