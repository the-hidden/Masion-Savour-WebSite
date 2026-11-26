import '../Styles/Menu.css';
import HeroTitle from '../Components/HeroTitle';
import { heroData } from '../data/heroData';
import MenuSection from '../Components/MenuSection';

const Menu = () => {
  return (
    <div className='menu-bg'>
      <main className='div-menu'>
        <HeroTitle {...heroData.menu} />
        <MenuSection />
      </main>
    </div>
  )
}

export default Menu