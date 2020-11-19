import FixedContainer from "../components/FixedContainer";
import Header from "../components/Header";
import HtmlHead from "../components/HtmlHead";

export default function NotFound() {
    return (
        <>
            <HtmlHead title="Not found" />
            <Header />
            <FixedContainer>
                <h1>Not found</h1>
                <p>The page you're trying to reach could not be found.</p>
            </FixedContainer>
        </>
    );
}
