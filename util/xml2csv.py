import xml.etree.ElementTree as ET
import pandas as pd

def xml_to_csv(xml_file_path, csv_file_path):
    """
    XML 파일을 CSV 파일로 변환하는 함수
    
    Args:
        xml_file_path (str): XML 파일 경로
        csv_file_path (str): 저장할 CSV 파일 경로
    """
    # XML 파싱
    tree = ET.parse(xml_file_path)
    root = tree.getroot()

    # corp 리스트 생성 
    corps = []
    for corp in root.findall('list'):
        corp_dict = {}
        for child in corp:
            corp_dict[child.tag] = child.text
        corps.append(corp_dict)

    # DataFrame으로 변환
    df = pd.DataFrame(corps)

    # CSV로 저장
    df.to_csv(csv_file_path, index=False, encoding='utf-8-sig')


if __name__ == "__main__":
    # XML 파일 경로
    xml_file = '../data/corpcode_data/CORPCODE.xml'
    # 저장할 CSV 파일 경로 
    csv_file = '../data/corpcode_data/CORPCODE.csv'
    
    xml_to_csv(xml_file, csv_file)