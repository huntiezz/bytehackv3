import styles from './snow-globe.module.css';

export function SnowGlobe() {
    return (
        <div className={styles.snowglobeContainer}>
            <div className={styles.standCurvedWrap}>
                <div className={styles.standCurved}></div>
            </div>

            <div className={styles.sgBg}></div>

            {/* Ground snow inside globe */}
            <div className={styles.grndSnow}></div>

            {/* Snowman */}
            <div className={styles.snowmanBot}></div>
            <div className={styles.snowmanTop}>
                <div className={styles.coal}></div>
                <div className={styles.carrot}></div>
            </div>

            {/* Tree */}
            <div className={styles.tree}>
                <div className={styles.treeShadow}></div>
                <div className={styles.branchBot}>
                    <div className={styles.branchBotSnow}></div>
                </div>
                <div className={styles.branchMid}>
                    <div className={styles.branchMidSnow}></div>
                </div>
                <div className={styles.branchTop}>
                    <div className={styles.branchTopSnow}></div>
                </div>
                <div className={styles.star}></div>
                <div className={styles.baubles}></div>
            </div>

            {/* Falling Snow */}
            <div className={styles.fallingSnowWrap}>
                <div className={styles.fallingSnow}>
                    <div className={styles.flakes1}></div>
                    <div className={styles.flakes2}></div>
                </div>
            </div>

            <div className={styles.sgFg}></div>
        </div>
    );
}
