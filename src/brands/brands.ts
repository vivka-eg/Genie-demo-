// EG brand catalog for the sidebar switcher. Logos pulled from the EG brand API
// (api.brand.dev.egsync.com) and saved locally: `logo` is the horizontal lockup
// (with wordmark), `icon` is the square mark for the collapsed sidebar.
// `palette` drives the app theme via [data-brand] in theme.css.
import facilit from './facilit.svg'
import facilitIcon from './facilit-icon.svg'
import zynergy from './zynergy.svg'
import zynergyIcon from './zynergy-icon.svg'
import brandsync from './brandsync.svg'
import brandsyncIcon from './brandsync-icon.svg'
import holteportalen from './holteportalen.svg'
import holteportalenIcon from './holteportalen-icon.svg'
import vigilo from './vigilo.svg'
import vigiloIcon from './vigilo-icon.svg'
import mestro from './mestro.svg'
import mestroIcon from './mestro-icon.svg'
import landax from './landax.svg'
import landaxIcon from './landax-icon.svg'
import sagskom from './sagskom.svg'
import sagskomIcon from './sagskom-icon.svg'

export type Palette =
  | 'blue' | 'magenta' | 'teal' | 'orange' | 'jade' | 'violet' | 'cobalt' | 'green' | 'steel'

export type Brand = { id: string; name: string; logo: string; icon: string; palette: Palette }

export const BRANDS: Brand[] = [
  { id: 'facilit', name: 'EG Facilit', logo: facilit, icon: facilitIcon, palette: 'blue' },
  { id: 'zynergy', name: 'EG Zynergy', logo: zynergy, icon: zynergyIcon, palette: 'magenta' },
  { id: 'brandsync', name: 'EG BrandSync', logo: brandsync, icon: brandsyncIcon, palette: 'blue' },
  { id: 'holteportalen', name: 'EG HoltePortalen', logo: holteportalen, icon: holteportalenIcon, palette: 'orange' },
  { id: 'vigilo', name: 'EG Vigilo', logo: vigilo, icon: vigiloIcon, palette: 'cobalt' },
  { id: 'mestro', name: 'EG Mestro', logo: mestro, icon: mestroIcon, palette: 'jade' },
  { id: 'landax', name: 'EG Landax', logo: landax, icon: landaxIcon, palette: 'violet' },
  { id: 'sagskom', name: 'EG SagsKom', logo: sagskom, icon: sagskomIcon, palette: 'green' },
]
