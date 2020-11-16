import Link from "next/link";
import { Col, Row } from "react-grid-system";
import { Button } from "@blueprintjs/core";

import FixedContainer from "./FixedContainer";

import styles from "../styles/Header.module.css";

export interface Props {
    tab?: "data" | "functions" | "virtual-labs";
    subBarLinks?: readonly { key: string; href: string; label: string }[];
    subBarActiveKey?: string;
}

export default function Header({ tab, subBarLinks, subBarActiveKey }: Props) {
    return (
        <div className={styles.headerContainer} data-active-tab={tab}>
            <div>
                <FixedContainer>
                    <Row align="center" className={styles.navBar}>
                        <Col sm={3}>
                            <Link href="/">
                                <a>
                                    <img
                                        src="/EcoCommons Logo.png"
                                        title="EcoCommons Australia"
                                        alt="EcoCommons Australia"
                                        className={styles.logo}
                                    />
                                </a>
                            </Link>
                        </Col>
                        <Col sm={9}>
                            <div className={styles.navAndUserBlock}>
                                <Row justify="between" align="center">
                                    <ul className={styles.navLinks}>
                                        <li data-tab="data">
                                            <Link href="/data">
                                                <a>Data and Visualisations</a>
                                            </Link>
                                        </li>
                                        <li data-tab="functions">
                                            <Link href="/functions">
                                                <a>Tools and Functions</a>
                                            </Link>
                                        </li>
                                        <li data-tab="virtual-labs">
                                            <Link href="/virtual-labs">
                                                <a>Virtual Laboratories</a>
                                            </Link>
                                        </li>
                                    </ul>
                                    <div>
                                        <Button intent="success" outlined>
                                            Sign in / Register
                                        </Button>
                                    </div>
                                </Row>
                            </div>
                        </Col>
                    </Row>
                </FixedContainer>
            </div>
            {subBarLinks && (
                <div className={styles.subBar}>
                    <FixedContainer>
                        {subBarLinks.map(({ key, href, label }) => (
                            <Link href={href}>
                                <a
                                    className={
                                        key === subBarActiveKey
                                            ? styles.subBarLinkActive
                                            : undefined
                                    }
                                >
                                    {label}
                                </a>
                            </Link>
                        ))}
                    </FixedContainer>
                </div>
            )}
        </div>
    );
}
