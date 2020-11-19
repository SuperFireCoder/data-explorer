import {
    FixedContainer,
    Header,
    HtmlHead,
} from "@ecocommons-australia/ui-library";

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
