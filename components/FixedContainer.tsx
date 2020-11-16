import classnames from "classnames";

import styles from "../styles/FixedContainer.module.css";

export default function FixedContainer({
    className,
    ...props
}: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
>) {
    return (
        <div
            className={classnames(styles.bodyContainer, className)}
            {...props}
        />
    );
}
