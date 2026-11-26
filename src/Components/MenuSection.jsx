import { useState } from 'react'
import FoodCard from './FoodCard'
import { useMenuData } from '../hooks/useMenuData'
import styles from '../Styles/MenuSection.module.css'
import { MENU_CATEGORIES } from '../data/categories'

const MenuSection = () => {
    const [activeCategory, setActiveCategory] = useState('Desayuno');
    const { menuData } = useMenuData();

    const activeItems = menuData[activeCategory] || [];

    return (
        <section className={styles.menuSection}>

            <div className={styles.tabsContainer}>
                {MENU_CATEGORIES.map((category) => (
                    <button
                        key={category}
                        className={`${styles.tab} ${activeCategory === category ? styles.activeTab : ''}`}
                        onClick={() => setActiveCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className={styles.grid}>
                {activeItems.map((item) => (
                    <FoodCard key={item.id} item={item} />
                ))}
            </div>
        </section>
    );
};

export default MenuSection;