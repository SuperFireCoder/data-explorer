import Head from "next/head";

export interface Props {
    /** Title to appear in <head /> for webpage */
    title?: string | readonly string[];
}

export default function HtmlHead({ title }: Props) {
    let titleString: string = "";

    if (title) {
        if (typeof title === "string") {
            titleString = ` - ${title}`;
        } else {
            titleString = title.reduce(
                (str, segment) => str + ` - ${segment}`,
                ""
            );
        }
    }
    return (
        <Head>
            <title>EcoCommons{titleString}</title>
        </Head>
    );
}
